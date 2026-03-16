import { useState, useEffect } from "react";
import { Check, Trash2, Plus, Edit2, CheckCircle2, Circle, PartyPopper, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function ChecklistAI() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('cameraman-tasks');
    if (saved) return JSON.parse(saved);
    return [
      { id: "1", text: "Review biology chapter 4", completed: false },
      { id: "2", text: "Generate flashcards for history", completed: true },
      { id: "3", text: "Write intro paragraph for essay", completed: false }
    ];
  });
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [showCongrats, setShowCongrats] = useState(false);
  const [prevAllDone, setPrevAllDone] = useState(false);

  useEffect(() => {
    localStorage.setItem('cameraman-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Show congrats when all tasks become completed (and there are tasks)
  useEffect(() => {
    const allDone = tasks.length > 0 && tasks.every(t => t.completed);
    if (allDone && !prevAllDone) {
      setShowCongrats(true);
    }
    setPrevAllDone(allDone);
  }, [tasks]);

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setTasks([{ id: Date.now().toString(), text: input.trim(), completed: false }, ...tasks]);
    setInput("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditInput(task.text);
  };

  const saveEdit = () => {
    if (!editInput.trim()) {
      setEditingId(null);
      return;
    }
    setTasks(tasks.map(t => t.id === editingId ? { ...t, text: editInput.trim() } : t));
    setEditingId(null);
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.completed));
  };

  const remaining = tasks.filter(t => !t.completed).length;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col relative">
      {/* Congrats overlay */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-card border border-primary/30 rounded-2xl p-8 mx-4 text-center shadow-2xl max-w-sm w-full relative"
            >
              <button
                onClick={() => setShowCongrats(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5"
              >
                <PartyPopper className="w-10 h-10 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                You did it! 🎉
              </h2>
              <p className="text-muted-foreground mb-6">
                Congrats, you finished your checklist! Time to celebrate — you've earned it.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowCongrats(false)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  Keep going!
                </button>
                <button
                  onClick={() => { setShowCongrats(false); clearCompleted(); }}
                  className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all text-sm"
                >
                  Clear completed & start fresh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card rounded-2xl border border-border shadow-xl shadow-black/10 overflow-hidden flex flex-col h-full">
        
        {/* Header & Input */}
        <div className="p-6 border-b border-border bg-secondary/20">
          <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-primary w-7 h-7" /> Daily Planner
          </h2>
          <form onSubmit={addTask} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-input border border-border rounded-xl py-4 pl-4 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-lg shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/30 scrollbar-hide">
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-muted-foreground text-center"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg">All caught up!</p>
                <p className="text-sm">Add a task above to get started.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                      task.completed 
                        ? "bg-secondary/30 border-transparent" 
                        : "bg-card border-border shadow-sm hover:border-primary/30"
                    )}
                  >
                    <button onClick={() => toggleTask(task.id)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                      {task.completed ? <CheckCircle2 className="w-7 h-7 text-primary" /> : <Circle className="w-7 h-7" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      {editingId === task.id ? (
                        <input
                          autoFocus
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="w-full bg-input border border-primary/50 rounded px-2 py-1 outline-none text-foreground"
                        />
                      ) : (
                        <p 
                          className={cn(
                            "truncate text-lg transition-colors cursor-pointer",
                            task.completed ? "text-muted-foreground line-through" : "text-foreground"
                          )}
                          onClick={() => startEdit(task)}
                        >
                          {task.text}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(task)} className="p-2 text-muted-foreground hover:text-primary rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="p-4 border-t border-border bg-card flex justify-between items-center text-sm text-muted-foreground">
            <span>{remaining} task{remaining !== 1 ? 's' : ''} remaining</span>
            <button 
              onClick={clearCompleted}
              className="hover:text-foreground transition-colors"
            >
              Clear completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
