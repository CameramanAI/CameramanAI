import { useState, useRef } from "react";
import { Plus, Trash2, ArrowLeft, ArrowRight, RotateCcw, Upload, Loader2, Sparkles, CheckCircle2, Brain, ThumbsUp, ThumbsDown, Trophy } from "lucide-react";
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

async function generateFlashcards(content: string, count = 10): Promise<{ flashcards: { front: string; back: string }[] }> {
  const res = await fetch(`${BASE}/api/ai/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, count }),
  });
  if (!res.ok) throw new Error("Generation failed");
  return res.json();
}

interface Card {
  id: string;
  front: string;
  back: string;
}

interface PracticeState {
  queue: Card[];
  learned: string[];
  currentIndex: number;
  isFlipped: boolean;
  totalCards: number;
  done: boolean;
}

function initPractice(cards: Card[]): PracticeState {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return {
    queue: shuffled,
    learned: [],
    currentIndex: 0,
    isFlipped: false,
    totalCards: cards.length,
    done: false,
  };
}

export function FlashcardAI() {
  const [cards, setCards] = useState<Card[]>([
    { id: "1", front: "What does API stand for?", back: "Application Programming Interface" },
    { id: "2", front: "What is React?", back: "A JavaScript library for building user interfaces" },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<"study" | "practice" | "create" | "generate">("study");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [genContent, setGenContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [practice, setPractice] = useState<PracticeState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1)), 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => Math.max(prev - 1, 0)), 150);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    setCards([...cards, { id: Date.now().toString(), front: newFront, back: newBack }]);
    setNewFront("");
    setNewBack("");
    setMode("study");
    setCurrentIndex(cards.length);
  };

  const handleDelete = (id: string) => {
    const newCards = cards.filter((c) => c.id !== id);
    setCards(newCards);
    if (currentIndex >= newCards.length) {
      setCurrentIndex(Math.max(0, newCards.length - 1));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setIsUploading(true);
    try {
      const res = await uploadFile(file);
      setGenContent(res.content);
    } catch {
      alert("Failed to extract text from file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genContent.trim()) return;
    setIsGenerating(true);
    try {
      const res = await generateFlashcards(genContent, 10);
      const newCards = res.flashcards.map((c) => ({ ...c, id: Math.random().toString() }));
      setCards((prev) => [...prev, ...newCards]);
      setGenContent("");
      setUploadedFileName(null);
      setMode("study");
      setCurrentIndex(cards.length);
    } catch {
      alert("Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  // Practice mode handlers
  const startPractice = () => {
    if (cards.length === 0) return;
    setPractice(initPractice(cards));
    setMode("practice");
  };

  const practiceFlip = () => {
    if (!practice) return;
    setPractice({ ...practice, isFlipped: true });
  };

  const practiceAnswer = (knew: boolean) => {
    if (!practice) return;
    const current = practice.queue[practice.currentIndex];

    if (knew) {
      // Mark as learned, move forward
      const newLearned = [...practice.learned, current.id];
      const newQueue = practice.queue.filter((_, i) => i !== practice.currentIndex);
      if (newQueue.length === 0) {
        setPractice({ ...practice, queue: newQueue, learned: newLearned, isFlipped: false, done: true });
      } else {
        const nextIdx = practice.currentIndex >= newQueue.length ? 0 : practice.currentIndex;
        setPractice({ ...practice, queue: newQueue, learned: newLearned, currentIndex: nextIdx, isFlipped: false });
      }
    } else {
      // Move card to end of queue
      const newQueue = practice.queue.filter((_, i) => i !== practice.currentIndex);
      newQueue.push(current);
      const nextIdx = practice.currentIndex >= newQueue.length ? 0 : practice.currentIndex;
      setPractice({ ...practice, queue: newQueue, currentIndex: nextIdx, isFlipped: false });
    }
  };

  const exitPractice = () => {
    setPractice(null);
    setMode("study");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-card rounded-2xl border border-border shadow-xl shadow-black/10 overflow-hidden">
      {/* Tab bar */}
      <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setMode("study")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === "study" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary")}>
            Study Mode
          </button>
          <button onClick={startPractice} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", mode === "practice" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary")}>
            <Brain className="w-4 h-4" /> Practice
          </button>
          <button onClick={() => setMode("create")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === "create" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary")}>
            Add Manual
          </button>
          <button onClick={() => setMode("generate")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", mode === "generate" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary")}>
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
        </div>
        {mode === "study" && cards.length > 0 && (
          <div className="text-sm font-medium bg-background px-3 py-1.5 rounded-full border border-border">
            {currentIndex + 1} / {cards.length}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 flex items-center justify-center bg-background/50 relative overflow-hidden">

        {/* ── STUDY MODE ── */}
        {mode === "study" && (
          cards.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No flashcards yet.</p>
              <button onClick={() => setMode("generate")} className="mt-4 text-primary hover:underline">Generate some with AI</button>
            </div>
          ) : (
            <div className="w-full max-w-2xl flex flex-col items-center">
              <div className="w-full h-80 cursor-pointer mb-8" style={{ perspective: "1000px" }} onClick={() => setIsFlipped(!isFlipped)}>
                <motion.div
                  className="w-full h-full relative"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="absolute inset-0 bg-card border-2 border-border rounded-2xl shadow-xl flex items-center justify-center p-8 text-center" style={{ backfaceVisibility: "hidden" }}>
                    <p className="text-3xl font-medium text-foreground">{cards[currentIndex].front}</p>
                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground font-mono uppercase tracking-wider">FRONT · Click to flip</div>
                  </div>
                  <div className="absolute inset-0 bg-primary border-2 rounded-2xl shadow-xl flex items-center justify-center p-8 text-center text-primary-foreground" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <p className="text-2xl font-medium">{cards[currentIndex].back}</p>
                    <div className="absolute bottom-4 right-4 text-xs opacity-70 font-mono uppercase tracking-wider">BACK</div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center gap-6 w-full max-w-md justify-between bg-card p-3 rounded-2xl border border-border shadow-md">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setIsFlipped(!isFlipped)} className="flex-1 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider text-sm">
                  Flip Card
                </button>
                <button onClick={handleNext} disabled={currentIndex === cards.length - 1} className="p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>

              <button onClick={() => handleDelete(cards[currentIndex].id)} className="mt-6 flex items-center gap-2 text-sm text-destructive opacity-70 hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" /> Delete this card
              </button>
            </div>
          )
        )}

        {/* ── PRACTICE (BRAINSCAPE) MODE ── */}
        {mode === "practice" && practice && (
          practice.done ? (
            // Completion screen
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">Session Complete!</h2>
              <p className="text-muted-foreground mb-2">You mastered all <span className="font-bold text-foreground">{practice.totalCards}</span> cards.</p>
              <p className="text-sm text-muted-foreground mb-8">Great job! Keep practising to retain everything long-term.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={startPractice} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all">
                  Practice Again
                </button>
                <button onClick={exitPractice} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all">
                  Back to Study
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="w-full max-w-2xl flex flex-col items-center gap-6">
              {/* Progress bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" /> {practice.learned.length} learned</span>
                  <span>{practice.queue.length} remaining</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${(practice.learned.length / practice.totalCards) * 100}%` }}
                    transition={{ type: "spring" }}
                  />
                </div>
              </div>

              {/* Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={practice.queue[practice.currentIndex]?.id + (practice.isFlipped ? "-back" : "-front")}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
                >
                  <div
                    onClick={!practice.isFlipped ? practiceFlip : undefined}
                    className={cn(
                      "w-full min-h-64 rounded-2xl border-2 shadow-xl flex flex-col items-center justify-center p-8 text-center transition-all",
                      practice.isFlipped
                        ? "bg-primary border-primary cursor-default"
                        : "bg-card border-border cursor-pointer hover:border-primary/40"
                    )}
                  >
                    {practice.isFlipped ? (
                      <>
                        <p className="text-xs uppercase tracking-widest opacity-70 text-primary-foreground mb-4 font-mono">Answer</p>
                        <p className="text-2xl font-medium text-primary-foreground">{practice.queue[practice.currentIndex]?.back}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-medium text-foreground">{practice.queue[practice.currentIndex]?.front}</p>
                        <p className="text-xs text-muted-foreground mt-6 font-mono uppercase tracking-wider">Click to reveal answer</p>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Know it / Still learning buttons */}
              {practice.isFlipped && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 w-full max-w-sm">
                  <button
                    onClick={() => practiceAnswer(false)}
                    className="flex-1 flex flex-col items-center gap-2 py-4 bg-secondary border-2 border-border rounded-2xl font-semibold text-foreground hover:border-destructive/50 hover:bg-destructive/5 transition-all"
                  >
                    <ThumbsDown className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm">Still learning</span>
                  </button>
                  <button
                    onClick={() => practiceAnswer(true)}
                    className="flex-1 flex flex-col items-center gap-2 py-4 bg-primary/10 border-2 border-primary/30 rounded-2xl font-semibold text-primary hover:bg-primary/20 hover:border-primary transition-all"
                  >
                    <ThumbsUp className="w-6 h-6" />
                    <span className="text-sm">Got it!</span>
                  </button>
                </motion.div>
              )}

              <button onClick={exitPractice} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Exit practice
              </button>
            </div>
          )
        )}

        {/* ── CREATE MODE ── */}
        {mode === "create" && (
          <div className="w-full max-w-lg bg-card border border-border p-8 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-semibold mb-6 text-center">Add Flashcard</h3>
            <form onSubmit={handleAddManual} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Front (Question)</label>
                <textarea value={newFront} onChange={(e) => setNewFront(e.target.value)} className="w-full bg-input border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary/50 text-foreground resize-none h-24" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Back (Answer)</label>
                <textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} className="w-full bg-input border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary/50 text-foreground resize-none h-24" required />
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Add to Deck
              </button>
            </form>
          </div>
        )}

        {/* ── GENERATE MODE ── */}
        {mode === "generate" && (
          <div className="w-full max-w-2xl bg-card border border-border p-8 rounded-2xl shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold">AI Auto-Generate</h3>
              <p className="text-muted-foreground">Paste text or upload a file to instantly create a study deck.</p>
            </div>

            <div className="space-y-4">
              <textarea value={genContent} onChange={(e) => setGenContent(e.target.value)} placeholder="Paste lecture notes, articles, or any text here..." className="w-full bg-input border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary/50 text-foreground resize-none h-40" />

              <div className="flex items-center gap-3">
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt,.md,.png,.jpg,.jpeg" />
                {isUploading ? (
                  <div className="flex items-center gap-2 text-sm text-primary"><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</div>
                ) : uploadedFileName ? (
                  <div className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="w-4 h-4 text-primary" />{uploadedFileName}</div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                    <Upload className="w-4 h-4" /> Upload File
                  </button>
                )}
              </div>

              <button onClick={handleGenerate} disabled={!genContent.trim() || isGenerating} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>) : (<><Sparkles className="w-5 h-5" /> Generate Flashcards</>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
