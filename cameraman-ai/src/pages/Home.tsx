import { useState } from "react";
import { Navbar, TabId } from "@/components/layout/Navbar";
import { GeneralAI } from "@/components/sections/GeneralAI";
import { StudyAI } from "@/components/sections/StudyAI";
import { FlashcardAI } from "@/components/sections/FlashcardAI";
import { ChecklistAI } from "@/components/sections/ChecklistAI";
import { CoderAI } from "@/components/sections/CoderAI";
import { AboutMe } from "@/components/sections/AboutMe";

const TABS: TabId[] = ["general", "study", "flashcard", "checklist", "coder", "about"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-6 xl:py-10 relative">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {TABS.map((tab) => (
          <div
            key={tab}
            style={{ display: activeTab === tab ? "block" : "none" }}
            className="w-full h-full"
          >
            {tab === "general" && <GeneralAI />}
            {tab === "study" && <StudyAI />}
            {tab === "flashcard" && <FlashcardAI />}
            {tab === "checklist" && <ChecklistAI />}
            {tab === "coder" && <CoderAI />}
            {tab === "about" && <AboutMe />}
          </div>
        ))}
      </main>
    </div>
  );
}
