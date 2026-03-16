import { useState, useRef } from "react";
import { FileText, Youtube, Upload, Link as LinkIcon, Sparkles, Loader2, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { QuizRenderer } from "@/components/sections/QuizRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function uploadFile(file: File): Promise<{ content: string; filename: string; type: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/api/ai/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

async function generateStudy(content: string, type: "notes" | "quiz", youtubeUrls?: string[]): Promise<{ result: string; type: string }> {
  const res = await fetch(`${BASE}/api/ai/study`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, type, youtubeUrls }),
  });
  if (!res.ok) throw new Error("Generation failed");
  return res.json();
}

export function StudyAI() {
  const [content, setContent] = useState("");
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([""]);
  const [urlFileContent, setUrlFileContent] = useState("");
  const [urlFileName, setUrlFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "file" | "url">("text");
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"notes" | "quiz" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlUploading, setIsUrlUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlFileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsUploading(true);
    try {
      const res = await uploadFile(file);
      setContent(res.content);
    } catch {
      alert("Failed to extract text from file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUrlFileName(file.name);
    setIsUrlUploading(true);
    try {
      const res = await uploadFile(file);
      setUrlFileContent(res.content);
    } catch {
      alert("Failed to extract text from file");
    } finally {
      setIsUrlUploading(false);
    }
  };

  const addUrl = () => setYoutubeUrls((prev) => [...prev, ""]);
  const removeUrl = (idx: number) => setYoutubeUrls((prev) => prev.filter((_, i) => i !== idx));
  const updateUrl = (idx: number, val: string) =>
    setYoutubeUrls((prev) => prev.map((u, i) => (i === idx ? val : u)));

  const getActiveContent = () => {
    if (activeTab === "url") return urlFileContent;
    return content;
  };

  const getActiveUrls = () => {
    if (activeTab === "url") return youtubeUrls.filter((u) => u.trim());
    return [];
  };

  const canGenerate = () => {
    if (activeTab === "url") {
      return youtubeUrls.some((u) => u.trim()) || urlFileContent.trim().length > 0;
    }
    return content.trim().length > 0;
  };

  const handleGenerate = async (type: "notes" | "quiz") => {
    if (!canGenerate()) return;
    setResult(null);
    setResultType(type);
    setIsGenerating(true);
    try {
      const res = await generateStudy(getActiveContent(), type, getActiveUrls());
      setResult(res.result);
    } catch {
      alert("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = isUploading || isGenerating || isUrlUploading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
      <div className="lg:col-span-5 flex flex-col bg-card rounded-2xl border border-border shadow-xl shadow-black/10 overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex gap-2">
          <button onClick={() => setActiveTab("text")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "text" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <FileText className="w-4 h-4" /> Text
          </button>
          <button onClick={() => setActiveTab("file")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "file" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Upload className="w-4 h-4" /> File
          </button>
          <button onClick={() => setActiveTab("url")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "url" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Youtube className="w-4 h-4" /> YouTube
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          {activeTab === "text" && (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your study material, lecture notes, or transcript here..." className="flex-1 w-full bg-input border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none" />
          )}

          {activeTab === "file" && (
            <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center bg-input/50 hover:bg-input/80 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt,.md,.png,.jpg,.jpeg" />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground font-medium">Extracting text...</p>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-sm text-muted-foreground mt-1">Text extracted successfully</p>
                  <button className="mt-4 text-xs text-primary hover:underline">Upload a different file</button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Upload a Document</h3>
                  <p className="text-sm text-muted-foreground max-w-[250px]">Upload a PDF, image, or text file. We'll extract the content automatically.</p>
                </>
              )}
            </div>
          )}

          {activeTab === "url" && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">YouTube URLs</label>
                  <button onClick={addUrl} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                    <Plus className="w-3 h-3" /> Add URL
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {youtubeUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateUrl(idx, e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full bg-input border border-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                        />
                      </div>
                      {youtubeUrls.length > 1 && (
                        <button onClick={() => removeUrl(idx)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-secondary">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Extra Context (Optional)</label>
                <textarea value={urlFileContent} onChange={(e) => setUrlFileContent(e.target.value)} placeholder="Paste a transcript, notes, or any extra context here..." className="w-full bg-input border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none h-24 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Or Upload a File</label>
                <input type="file" className="hidden" ref={urlFileInputRef} onChange={handleUrlFileUpload} accept=".pdf,.txt,.md,.png,.jpg,.jpeg" />
                <div className="border border-dashed border-border rounded-xl p-4 bg-input/30 flex items-center justify-between cursor-pointer hover:bg-input/60 transition-colors" onClick={() => urlFileInputRef.current?.click()}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {isUrlUploading ? (
                      <span className="text-sm text-primary flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Reading...</span>
                    ) : urlFileName ? (
                      <span className="text-sm font-mono text-foreground">{urlFileName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Upload PDF, image, or text file</span>
                    )}
                  </div>
                  <span className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md font-medium transition-colors">Browse</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border shrink-0">
            <button onClick={() => handleGenerate("notes")} disabled={isLoading || !canGenerate()} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <FileText className="w-4 h-4" /> Generate Notes
            </button>
            <button onClick={() => handleGenerate("quiz")} disabled={isLoading || !canGenerate()} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <Sparkles className="w-4 h-4" /> Generate Quiz
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-card rounded-2xl border border-border shadow-xl shadow-black/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {resultType === "quiz" ? <Sparkles className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
            {resultType === "quiz" ? "Practice Quiz" : "Study Notes"}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium animate-pulse text-foreground">Analyzing content...</p>
                <p className="text-sm text-muted-foreground mt-2">Creating tailored {resultType} for you</p>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {resultType === "quiz" ? (
                  <QuizRenderer raw={result} onReset={() => setResult(null)} />
                ) : (
                  <Markdown content={result} />
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 opacity-50" />
                </div>
                <p>Your generated content will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
