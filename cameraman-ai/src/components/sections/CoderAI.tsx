import { useState, useRef } from "react";
import { Code2, Copy, Check, Upload, Loader2, Play, Send, RotateCcw } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CodeMessage {
  role: "user" | "assistant";
  content: string;
  code?: string;
  explanation?: string;
}

async function uploadFile(file: File): Promise<{ content: string; filename: string; type: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/api/ai/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

async function generateCode(
  language: string,
  description: string,
  history: { role: string; content: string }[],
  fileContent?: string
): Promise<{ code: string; language: string; explanation: string }> {
  const res = await fetch(`${BASE}/api/ai/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, description, history, fileContent }),
  });
  if (!res.ok) throw new Error("Generation failed");
  return res.json();
}

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "SQL", "HTML/CSS", "Bash"];

export function CoderAI() {
  const [language, setLanguage] = useState("Python");
  const [input, setInput] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<CodeMessage[]>([]);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsUploading(true);
    try {
      const res = await uploadFile(file);
      setFileContent(res.content);
    } catch {
      alert("Failed to extract code from file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMsg = input.trim();
    setInput("");

    const newMessages: CodeMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsGenerating(true);

    // Build history for API (summarize code in assistant messages)
    const history = newMessages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.code
        ? `${m.content}\n\nCode produced:\n\`\`\`${language.toLowerCase()}\n${m.code}\n\`\`\``
        : m.content,
    }));

    try {
      const res = await generateCode(language, userMsg, history, fileContent || undefined);
      setCurrentCode(res.code);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.explanation || "Here's the code:", code: res.code, explanation: res.explanation },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentCode(null);
    setInput("");
  };

  const copyToClipboard = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[700px]">
      {/* Left: Settings panel */}
      <div className="lg:col-span-4 bg-card rounded-2xl border border-border shadow-xl shadow-black/10 p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Coder AI</h2>
          {hasMessages && (
            <button onClick={handleReset} className="ml-auto p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="New session">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer">
            {LANGUAGES.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Context File (Optional)</label>
          <div className="border border-dashed border-border rounded-xl p-4 bg-input/30 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-secondary rounded-lg shrink-0">
                <Upload className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="truncate">
                {isUploading ? (
                  <span className="text-sm text-primary flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Reading...</span>
                ) : fileName ? (
                  <span className="text-sm font-mono text-foreground truncate block">{fileName}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Upload code or PDF</span>
                )}
              </div>
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md font-medium transition-colors shrink-0">Browse</button>
          </div>
        </div>

        <div className="mt-auto bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How it works</p>
          <ul className="space-y-1 text-xs">
            <li>• Describe what you want to build</li>
            <li>• Get simple, readable code instantly</li>
            <li>• Ask for changes in the chat below</li>
            <li>• e.g. "make it handle errors" or "add a loop"</li>
          </ul>
        </div>
      </div>

      {/* Right: Code output + chat */}
      <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
        {/* Code panel */}
        <div className="bg-[#1e1e1e] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#404040] shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-gray-400">
                {currentCode ? `output.${language.toLowerCase().replace("/css", "").replace("html/", "")}` : "waiting..."}
              </span>
            </div>
            {currentCode && (
              <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isGenerating && !currentCode ? (
              <div className="h-full flex items-center justify-center text-primary">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : currentCode ? (
              <AnimatePresence mode="wait">
                <motion.div key={currentCode.slice(0, 20)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SyntaxHighlighter
                    language={language.toLowerCase().replace("html/css", "html").replace("c++", "cpp").replace("c#", "csharp")}
                    style={vscDarkPlus as any}
                    customStyle={{ margin: 0, padding: "1.5rem", background: "transparent", fontSize: "0.875rem" }}
                  >
                    {currentCode}
                  </SyntaxHighlighter>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-sm opacity-50">
                // Your code will appear here
              </div>
            )}
          </div>
        </div>

        {/* Chat input area */}
        <div className="bg-card rounded-2xl border border-border shadow-xl shadow-black/10 p-4 shrink-0">
          {/* Previous messages (explanation) */}
          <AnimatePresence>
            {messages.length > 0 && (
              <div className="mb-3 max-h-28 overflow-y-auto space-y-1">
                {messages.filter(m => m.role === "assistant").slice(-1).map((m, i) => (
                  <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
                    <span className="text-primary font-medium">AI: </span>{m.explanation || m.content}
                  </motion.p>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasMessages ? "Ask for changes... e.g. 'add error handling' or 'make it shorter'" : "Describe what you want to build..."}
              className="flex-1 bg-input border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none min-h-[52px] max-h-[120px] text-sm"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={cn(
                "p-3 rounded-xl font-semibold shadow-lg transition-all shrink-0",
                hasMessages
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isGenerating
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : hasMessages
                  ? <Send className="w-5 h-5" />
                  : <Play className="w-5 h-5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
