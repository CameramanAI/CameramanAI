import { Camera, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General AI" },
  { id: "study", label: "Study AI" },
  { id: "flashcard", label: "Flashcard AI" },
  { id: "checklist", label: "Checklist AI" },
  { id: "coder", label: "Coder AI" },
  { id: "about", label: "About Me" },
] as const;

export type TabId = typeof TABS[number]["id"];

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4 md:gap-0">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Cameraman AI
            </h1>
            {/* Beta badge */}
            <div className="flex items-center gap-1 bg-primary/15 border border-primary/30 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
              <Hammer className="w-3 h-3" />
              Beta
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 mask-edges">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
