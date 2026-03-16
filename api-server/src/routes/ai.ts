import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ai as gemini } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, imageBase64, imageType } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      imageBase64?: string;
      imageType?: string;
    };

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages: Parameters<typeof openai.chat.completions.create>[0]["messages"] = messages.map((m, idx) => {
      if (idx === messages.length - 1 && m.role === "user" && imageBase64) {
        return {
          role: "user",
          content: [
            { type: "text" as const, text: m.content },
            {
              type: "image_url" as const,
              image_url: { url: `data:${imageType ?? "image/jpeg"};base64,${imageBase64}` },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
    res.end();
  }
});

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchYoutubeTranscript(url: string): Promise<string> {
  const videoId = extractYoutubeId(url);
  if (!videoId) return "";
  try {
    // Fetch the YouTube watch page and extract the timedtext URL
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await pageRes.text();

    // Extract ytInitialPlayerResponse JSON
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!match) return "";
    const playerResponse = JSON.parse(match[1]);

    // Get caption tracks
    const tracks: any[] = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return "";

    // Prefer English, then first available
    const track = tracks.find((t: any) => t.languageCode === "en") ?? tracks[0];
    const timedTextUrl: string = track.baseUrl;

    // Fetch transcript XML
    const xmlRes = await fetch(timedTextUrl + "&fmt=json3");
    const json = await xmlRes.json() as any;

    const text = (json.events ?? [])
      .filter((e: any) => e.segs)
      .map((e: any) => e.segs.map((s: any) => s.utf8).join(""))
      .join(" ")
      .replace(/\[Music\]|\[Applause\]|\[Laughter\]/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (err) {
    console.error("YouTube transcript error:", err);
    return "";
  }
}

router.post("/study", async (req: Request, res: Response) => {
  try {
    const { content, type, youtubeUrls } = req.body as {
      content: string;
      type: "notes" | "quiz";
      youtubeUrls?: string[];
    };

    const hasUrls = youtubeUrls && youtubeUrls.length > 0;
    const hasContent = content && content.trim().length > 0;

    // Build the task prompt
    const notesPrompt = `You are a study assistant. Analyze this content and create comprehensive, well-organized study notes with:
- Clear headings and subtopics
- Key definitions and terms
- Important facts and concepts
- A short summary at the end`;

    const quizPrompt = `You are a study assistant. Generate exactly 10 multiple-choice quiz questions based on this content.

Use this EXACT format for every question (no deviations):
Q1. [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [A, B, C, or D]

Q2. ...`;

    const taskInstruction = type === "notes" ? notesPrompt : quizPrompt;

    // === YouTube URLs → use Gemini which natively understands YouTube videos ===
    if (hasUrls) {
      const contentParts: any[] = [];

      // Add each YouTube URL as a fileData part (Gemini reads these natively)
      for (const url of youtubeUrls!) {
        contentParts.push({
          fileData: { fileUri: url, mimeType: "video/mp4" },
        });
      }

      // Add any extra text content
      if (hasContent) {
        contentParts.push({ text: `Additional context from user:\n${content}` });
      }

      contentParts.push({ text: taskInstruction });

      const geminiRes = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: contentParts }],
        config: { maxOutputTokens: 8192 },
      });

      const result = geminiRes.text ?? "";
      res.json({ result });
      return;
    }

    // === Text/PDF/URL content only → use OpenAI ===
    if (!hasContent) {
      res.status(400).json({ error: "No content provided" });
      return;
    }

    let prompt = "";
    if (type === "notes") {
      prompt = `${taskInstruction}

Content to analyze:
${content}`;
    } else {
      prompt = `${taskInstruction}

Content:
${content}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0]?.message?.content ?? "";
    res.json({ result, type });
  } catch (err) {
    console.error("Study error:", err);
    res.status(500).json({ error: "Failed to generate study content" });
  }
});

router.post("/flashcards", async (req: Request, res: Response) => {
  try {
    const { content, count = 10 } = req.body as { content: string; count?: number };

    const prompt = `You are a study assistant. Create exactly ${count} flashcards from the following content.
Each flashcard should have a clear question/term on the front and a concise answer/definition on the back.

Content:
${content}

Respond ONLY with a valid JSON array in this exact format:
[
  {"front": "Question or term here", "back": "Answer or definition here"},
  ...
]

Do not include any text before or after the JSON array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "[]";

    let flashcards: { front: string; back: string }[] = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      }
    } catch {
      flashcards = [{ front: "Error parsing flashcards", back: "Please try again" }];
    }

    res.json({ flashcards });
  } catch (err) {
    console.error("Flashcard error:", err);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

router.post("/code", async (req: Request, res: Response) => {
  try {
    const { language, description, fileContent, history = [] } = req.body as {
      language: string;
      description: string;
      fileContent?: string;
      history?: { role: string; content: string }[];
    };

    const contextPart = fileContent
      ? `\n\nExisting code/file context:\n\`\`\`\n${fileContent}\n\`\`\``
      : "";

    const prompt = `You are a helpful ${language} coding assistant. Generate simple, readable ${language} code for the following request.

RULES:
- Keep the code SHORT and SIMPLE — avoid unnecessary complexity
- Use clear variable names and add brief comments only where helpful
- Prefer straightforward solutions over clever or advanced ones
- Beginner-friendly code is always preferred

Request: ${description}${contextPart}

Respond with a JSON object in this format:
{
  "code": "the actual code here (keep it simple!)",
  "explanation": "1-2 sentence plain-English explanation of what it does"
}`;

    const chatMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: `You are a helpful ${language} coding assistant. Keep code simple, short, and beginner-friendly. Always respond with a JSON object: { "code": "...", "explanation": "..." }` },
      ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user", content: prompt },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let code = "";
    let explanation = "";
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        code = parsed.code ?? raw;
        explanation = parsed.explanation ?? "";
      } else {
        code = raw;
        explanation = "";
      }
    } catch {
      code = raw;
      explanation = "";
    }

    res.json({ code, language, explanation });
  } catch (err) {
    console.error("Code gen error:", err);
    res.status(500).json({ error: "Failed to generate code" });
  }
});

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const { originalname, mimetype, buffer } = req.file;
    let content = "";
    let type = "text";

    if (mimetype === "application/pdf") {
      type = "pdf";
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        content = data.text;
      } catch {
        content = "Could not extract PDF text. Please try pasting the content directly.";
      }
    } else if (mimetype.startsWith("image/")) {
      type = "image";
      const base64 = buffer.toString("base64");

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Please extract and transcribe all text from this image. If it contains study material, notes, or code, format it clearly. If it's a diagram or visual, describe it in detail." },
              { type: "image_url", image_url: { url: `data:${mimetype};base64,${base64}` } },
            ],
          },
        ],
      });
      content = response.choices[0]?.message?.content ?? "Could not extract content from image.";
    } else if (mimetype.startsWith("text/")) {
      type = "text";
      content = buffer.toString("utf-8");
    } else {
      type = "text";
      content = buffer.toString("utf-8");
    }

    res.json({
      content: content.trim(),
      filename: originalname,
      type,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

export default router;
