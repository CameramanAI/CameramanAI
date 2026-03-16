import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestion {
  number: number;
  question: string;
  options: { letter: string; text: string }[];
  answer: string;
}

function parseQuiz(raw: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const blocks = raw.split(/\n(?=Q\d+\.)/);

  for (const block of blocks) {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const qMatch = lines[0].match(/^Q(\d+)\.\s*(.+)/);
    if (!qMatch) continue;

    const number = parseInt(qMatch[1]);
    const question = qMatch[2].trim();

    const options: { letter: string; text: string }[] = [];
    let answer = "";

    for (let i = 1; i < lines.length; i++) {
      const optMatch = lines[i].match(/^([A-D])\)\s*(.+)/);
      if (optMatch) {
        options.push({ letter: optMatch[1], text: optMatch[2].trim() });
        continue;
      }
      const ansMatch = lines[i].match(/^Answer:\s*([A-D])/i);
      if (ansMatch) {
        answer = ansMatch[1].toUpperCase();
      }
    }

    if (options.length >= 2 && answer) {
      questions.push({ number, question, options, answer });
    }
  }

  return questions;
}

interface QuizRendererProps {
  raw: string;
  onReset: () => void;
}

export function QuizRenderer({ raw, onReset }: QuizRendererProps) {
  const questions = parseQuiz(raw);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4 bg-secondary/30 rounded-xl">
        <p className="font-medium mb-1">Could not parse quiz format.</p>
        <pre className="whitespace-pre-wrap text-xs opacity-70">{raw}</pre>
      </div>
    );
  }

  const answeredCount = Object.keys(selected).length;
  const correctCount = questions.filter((q) => selected[q.number] === q.answer).length;

  const handleSelect = (qNum: number, letter: string) => {
    if (selected[qNum]) return;
    setSelected((prev) => ({ ...prev, [qNum]: letter }));
  };

  const handleFinish = () => setFinished(true);

  const handleReset = () => {
    setSelected({});
    setFinished(false);
    onReset();
  };

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-2">Quiz Complete!</h2>
        <p className="text-muted-foreground mb-6">You scored</p>
        <div className="text-6xl font-bold text-primary mb-2">{pct}%</div>
        <p className="text-muted-foreground mb-8">
          {correctCount} / {questions.length} correct
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all"
          >
            New Quiz
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {answeredCount} / {questions.length} answered
        </p>
        <div className="h-2 flex-1 mx-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
        {answeredCount === questions.length && (
          <button
            onClick={handleFinish}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Trophy className="w-4 h-4" /> See Results
          </button>
        )}
      </div>

      <AnimatePresence>
        {questions.map((q, qi) => {
          const userAnswer = selected[q.number];
          const isAnswered = !!userAnswer;

          return (
            <motion.div
              key={q.number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.04 }}
              className="bg-secondary/30 rounded-2xl p-5 border border-border"
            >
              <p className="font-semibold text-foreground mb-4">
                <span className="text-primary mr-2">Q{q.number}.</span>
                {q.question}
              </p>

              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt) => {
                  const isSelected = userAnswer === opt.letter;
                  const isCorrect = opt.letter === q.answer;
                  const showResult = isAnswered;

                  let btnClass =
                    "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ";

                  if (!showResult) {
                    btnClass += "border-border bg-input hover:border-primary/50 hover:bg-secondary cursor-pointer";
                  } else if (isCorrect) {
                    btnClass += "border-green-500/60 bg-green-500/10 text-green-400 cursor-default";
                  } else if (isSelected && !isCorrect) {
                    btnClass += "border-red-500/60 bg-red-500/10 text-red-400 cursor-default";
                  } else {
                    btnClass += "border-border/40 bg-input/30 text-muted-foreground cursor-default opacity-60";
                  }

                  return (
                    <button
                      key={opt.letter}
                      className={btnClass}
                      onClick={() => handleSelect(q.number, opt.letter)}
                      disabled={isAnswered}
                    >
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        !showResult ? "bg-secondary text-muted-foreground" :
                        isCorrect ? "bg-green-500/20 text-green-400" :
                        isSelected ? "bg-red-500/20 text-red-400" :
                        "bg-secondary/50 text-muted-foreground"
                      )}>
                        {opt.letter}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={cn(
                    "mt-3 text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1",
                    userAnswer === q.answer
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {userAnswer === q.answer
                    ? "✓ Correct!"
                    : `✗ Incorrect — correct answer: ${q.answer}`}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
