import { useState } from "react";
import { Header } from "@/components/Header";
import { NotesPage } from "@/components/NotesPage";
import { SettingsPage } from "@/components/SettingsPage";
import { FloatingChat } from "@/components/FloatingChat";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";

type Page = "notes" | "settings";

function AppContent() {
  const [activePage, setActivePage] = useState<Page>("notes");
  const { theme } = useSettings();

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Header activePage={activePage} onPageChange={setActivePage} />
      {activePage === "notes" && <NotesPage />}
      {activePage === "settings" && <SettingsPage />}
      
      {/* Floating AI Chat Assistant */}
      <FloatingChat />
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
