import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { useSettings } from "@/context/SettingsContext";
import { Modal } from "./Modal";
import { 
  fetchNotesFromDB, 
  saveNoteToDB, 
  updateNoteInDB, 
  deleteNoteFromDB, 
  convertDbNoteToFrontend, 
  convertFrontendNoteToDb 
} from "../services/notesService";

// ============ TYPES ============

type NoteCategory = "all" | "checklist" | "note" | "task" | "article";

interface ChecklistItem {
  id: number;
  text: string;
  checked: boolean;
}

interface BaseNote {
  id: number;
  title: string;
  date: string;
  color: string;
}

interface ChecklistNote extends BaseNote {
  type: "checklist";
  items: ChecklistItem[];
}

interface StandardNote extends BaseNote {
  type: "note";
  content: string;
}

interface TaskNote extends BaseNote {
  type: "task";
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  dueDate: string;
  description: string;
}

interface ArticleNote extends BaseNote {
  type: "article";
  content: string;
  readTime: string;
  tags: string[];
}

type Note = ChecklistNote | StandardNote | TaskNote | ArticleNote;

// ============ DATA ============

const COLORS: Record<string, string> = {
  checklist: "emerald",
  note: "amber",
  task: "blue",
  article: "purple",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const initialNotes: Note[] = [
  {
    id: 1, type: "checklist", title: "Morning Routine", color: COLORS.checklist, date: "Today",
    items: [
      { id: 1, text: "Meditate for 10 minutes", checked: true },
      { id: 2, text: "Exercise / Stretch", checked: true },
      { id: 3, text: "Review daily goals", checked: false },
      { id: 4, text: "Check emails", checked: false },
      { id: 5, text: "Plan top 3 priorities", checked: false },
    ],
  },
  {
    id: 2, type: "note", title: "Project Ideas", color: COLORS.note, date: "Today",
    content: "Build a personal dashboard with weather, tasks, and calendar integration. Use React + Tailwind for the frontend. Consider adding a Pomodoro timer and habit tracker.",
  },
  {
    id: 3, type: "task", title: "Redesign Landing Page", color: COLORS.task, date: "Yesterday",
    description: "Update the hero section, add testimonials, and improve CTA placement for better conversion rates.",
    priority: "high", status: "in-progress", dueDate: "Dec 20",
  },
  {
    id: 4, type: "article", title: "Understanding React Server Components", color: COLORS.article, date: "2 days ago",
    content: "React Server Components represent a new paradigm in building React applications. They allow components to run on the server, reducing the JavaScript sent to the client. This leads to faster page loads and better SEO. Key benefits include automatic code splitting, direct database access, and zero-bundle-size components. The mental model shifts from thinking about client-server boundaries to thinking about component-level data requirements.",
    readTime: "5 min read", tags: ["React", "Web Dev", "Performance"],
  },
  {
    id: 5, type: "checklist", title: "Grocery List", color: COLORS.checklist, date: "Today",
    items: [
      { id: 1, text: "Avocados", checked: false },
      { id: 2, text: "Eggs", checked: true },
      { id: 3, text: "Whole wheat bread", checked: false },
      { id: 4, text: "Olive oil", checked: true },
      { id: 5, text: "Spinach", checked: false },
      { id: 6, text: "Chicken breast", checked: false },
    ],
  },
  {
    id: 6, type: "task", title: "Write Unit Tests", color: COLORS.task, date: "Yesterday",
    description: "Add comprehensive tests for the authentication module and API endpoints.",
    priority: "medium", status: "todo", dueDate: "Dec 22",
  },
  {
    id: 7, type: "note", title: "Meeting Notes - Q4 Planning", color: COLORS.note, date: "3 days ago",
    content: "Discussed Q4 roadmap priorities:\n- Performance improvements\n- New onboarding flow\n- Mobile responsiveness\n- Analytics dashboard\n\nAction items assigned to team leads. Follow-up next Thursday.",
  },
  {
    id: 8, type: "article", title: "The Art of Clean Code", color: COLORS.article, date: "4 days ago",
    content: "Clean code is not just about formatting. It is about communication. Good code tells a story that other developers can understand. Focus on meaningful variable names, small functions with single responsibilities, and thoughtful abstraction layers. Remember: code is read far more often than it is written. Invest time in making your code readable and maintainable.",
    readTime: "8 min read", tags: ["Best Practices", "Clean Code"],
  },
  {
    id: 9, type: "task", title: "Deploy to Production", color: COLORS.task, date: "5 days ago",
    description: "Push the latest release to production after QA sign-off. Update release notes.",
    priority: "low", status: "done", dueDate: "Dec 15",
  },
];

// ============ GOOGLE DRIVE HELPERS ============

function useGoogleDrive() {
  const { driveSettings, setDriveSettings } = useSettings();

  const saveNotesToDrive = async (notes: Note[]) => {
    if (!driveSettings.connected || !driveSettings.apiKey) return false;
    try {
      const fileContent = JSON.stringify(notes, null, 2);
      const metadata = {
        name: "workspace-notes.json",
        mimeType: "application/json",
        ...(driveSettings.folderId ? { parents: [driveSettings.folderId] } : {}),
      };
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='workspace-notes.json'&key=${driveSettings.apiKey}`;
      const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${driveSettings.clientId}` } });
      let fileId = "";
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files?.length > 0) fileId = searchData.files[0].id;
      }
      const boundary = "workspace_boundary";
      const body = [`--${boundary}`, "Content-Type: application/json; charset=UTF-8", "", JSON.stringify(metadata), `--${boundary}`, "Content-Type: application/json", "", fileContent, `--${boundary}--`].join("\r\n");
      const url = fileId ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart` : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
      const method = fileId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${driveSettings.clientId}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body });
      if (res.ok) {
        const now = new Date().toLocaleString();
        setDriveSettings({ ...driveSettings, lastSynced: now });
        return true;
      }
      return false;
    } catch { return false; }
  };

  const loadNotesFromDrive = async (): Promise<Note[] | null> => {
    if (!driveSettings.connected || !driveSettings.apiKey) return null;
    try {
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='workspace-notes.json'&key=${driveSettings.apiKey}`;
      const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${driveSettings.clientId}` } });
      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      if (!searchData.files?.length) return null;
      const fileId = searchData.files[0].id;
      const fileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${driveSettings.apiKey}`;
      const fileRes = await fetch(fileUrl, { headers: { Authorization: `Bearer ${driveSettings.clientId}` } });
      if (!fileRes.ok) return null;
      const notes = await fileRes.json();
      const now = new Date().toLocaleString();
      setDriveSettings({ ...driveSettings, lastSynced: now });
      return notes;
    } catch { return null; }
  };

  return { saveNotesToDrive, loadNotesFromDrive, isConnected: driveSettings.connected, autoSync: driveSettings.autoSync, lastSynced: driveSettings.lastSynced };
}

// ============ THEME-AWARE NOTE COLORS ============

function useNoteColors() {
  const { themeId } = useSettings();
  const isDark = themeId !== "light";

  return {
    noteCardBg: (type: string) => {
      if (!isDark) {
        const map: Record<string, string> = { checklist: "bg-emerald-50 border-emerald-200", note: "bg-amber-50 border-amber-200", task: "bg-blue-50 border-blue-200", article: "bg-purple-50 border-purple-200" };
        return map[type] || "bg-white border-slate-200";
      }
      const map: Record<string, string> = { checklist: "bg-emerald-500/5 border-emerald-500/20", note: "bg-amber-500/5 border-amber-500/20", task: "bg-blue-500/5 border-blue-500/20", article: "bg-purple-500/5 border-purple-500/20" };
      return map[type] || "bg-white/5 border-white/10";
    },
    badgeColor: (type: string) => {
      const map: Record<string, string> = { checklist: "bg-emerald-500/15 text-emerald-500", note: "bg-amber-500/15 text-amber-500", task: "bg-blue-500/15 text-blue-500", article: "bg-purple-500/15 text-purple-500" };
      return map[type] || "bg-slate-500/15 text-slate-500";
    },
    priorityColor: (p: string) => {
      const map: Record<string, string> = { low: "bg-green-500/15 text-green-500", medium: "bg-yellow-500/15 text-yellow-500", high: "bg-red-500/15 text-red-500" };
      return map[p] || "";
    },
    statusColor: (s: string) => {
      if (!isDark) {
        const map: Record<string, string> = { todo: "bg-slate-100 text-slate-600", "in-progress": "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700" };
        return map[s] || "";
      }
      const map: Record<string, string> = { todo: "bg-slate-500/15 text-slate-400", "in-progress": "bg-blue-500/15 text-blue-400", done: "bg-green-500/15 text-green-400" };
      return map[s] || "";
    },
    progressBar: "bg-emerald-500",
    progressTrack: isDark ? "bg-emerald-500/20" : "bg-emerald-100",
    checkboxActive: "border-emerald-500 bg-emerald-500",
    checkboxInactive: isDark ? "border-white/30 hover:border-emerald-400" : "border-slate-300 hover:border-emerald-400",
    tagBg: isDark ? "bg-purple-500/15 text-purple-400" : "bg-purple-100/80 text-purple-600",
    accentGradient: (type: string) => {
      const map: Record<string, string> = {
        checklist: "from-emerald-400 to-emerald-600",
        note: "from-amber-400 to-amber-600",
        task: "from-blue-400 to-blue-600",
        article: "from-purple-400 to-purple-600",
      };
      return map[type] || "from-slate-400 to-slate-600";
    },
  };
}

// ============ CATEGORY DEFINITIONS ============

const categoryTabs: { key: NoteCategory; label: string; icon: ReactNode }[] = [
  {
    key: "all", label: "All",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  },
  {
    key: "checklist", label: "Checklists",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  },
  {
    key: "note", label: "Notes",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14,2 14,8 20,8" /></svg>,
  },
  {
    key: "task", label: "Tasks",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  },
  {
    key: "article", label: "Articles",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  },
];

// ============ CREATE FORM COMPONENT ============

function CreateForm({ type, onClose, onSave }: { type: NoteCategory; onClose: () => void; onSave: (note: Note) => void }) {
  const { theme } = useSettings();
  const nc = useNoteColors();
  const [activeType, setActiveType] = useState<"checklist" | "note" | "task" | "article">(type === "all" ? "note" : (type as "checklist" | "note" | "task" | "article"));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checkItems, setCheckItems] = useState<string[]>([""]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");

  const addCheckItem = () => setCheckItems([...checkItems, ""]);
  const updateCheckItem = (index: number, value: string) => { const updated = [...checkItems]; updated[index] = value; setCheckItems(updated); };
  const removeCheckItem = (index: number) => { if (checkItems.length > 1) setCheckItems(checkItems.filter((_, i) => i !== index)); };

  const handleSave = () => {
    if (!title.trim()) return;
    const base = { id: Date.now(), title: title.trim(), date: "Just now", color: COLORS[activeType] };
    switch (activeType) {
      case "checklist":
        onSave({ ...base, type: "checklist", items: checkItems.filter((t) => t.trim()).map((t, i) => ({ id: i + 1, text: t.trim(), checked: false })) });
        break;
      case "note":
        onSave({ ...base, type: "note", content: content.trim() });
        break;
      case "task":
        onSave({ ...base, type: "task", description: content.trim(), priority, status: "todo", dueDate: dueDate || "No date" });
        break;
      case "article":
        onSave({ ...base, type: "article", content: content.trim(), readTime: `${Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))} min read`, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) });
        break;
    }
  };

  const typeOptions: { key: "checklist" | "note" | "task" | "article"; label: string }[] = [
    { key: "checklist", label: "Checklist" }, { key: "note", label: "Note" }, { key: "task", label: "Task" }, { key: "article", label: "Article" },
  ];

  return (
    <div className={cn("mb-6 rounded-2xl border p-6 shadow-lg", theme.cardBg, theme.cardBorder)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={cn("text-lg font-bold", theme.textPrimary)}>Create New</h3>
        <button onClick={onClose} className={cn("rounded-lg p-1.5 transition", theme.textMuted, theme.hoverBg)}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {typeOptions.map((opt) => (
          <button key={opt.key} onClick={() => setActiveType(opt.key)} className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all", activeType === opt.key ? cn(nc.badgeColor(opt.key), "ring-2 ring-current/30 ring-offset-1") : cn(theme.badgeBg, theme.textMuted))}>
            {opt.label}
          </button>
        ))}
      </div>
      <input type="text" placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)} className={cn("mb-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)} autoFocus />

      {activeType === "checklist" && (
        <div className="mb-4 space-y-2">
          {checkItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn("h-4 w-4 rounded border-2", nc.checkboxInactive)} />
              <input type="text" placeholder={`Item ${i + 1}...`} value={item} onChange={(e) => updateCheckItem(i, e.target.value)} className={cn("flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)} />
              <button onClick={() => removeCheckItem(i)} className={cn("flex h-7 w-7 items-center justify-center rounded-lg", theme.textMuted, "hover:text-red-500")}>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addCheckItem} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add item
          </button>
        </div>
      )}

      {(activeType === "note" || activeType === "article") && (
        <textarea placeholder={activeType === "article" ? "Write your article content..." : "Write your note..."} value={content} onChange={(e) => setContent(e.target.value)} rows={activeType === "article" ? 6 : 3} className={cn("mb-4 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)} />
      )}

      {activeType === "task" && (
        <>
          <textarea placeholder="Task description..." value={content} onChange={(e) => setContent(e.target.value)} rows={2} className={cn("mb-4 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)} />
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className={cn("mb-1 block text-xs font-medium", theme.textMuted)}>Priority</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button key={p} onClick={() => setPriority(p)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all", priority === p ? cn(nc.priorityColor(p), "ring-2 ring-current/30") : cn(theme.badgeBg, theme.textMuted))}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={cn("mb-1 block text-xs font-medium", theme.textMuted)}>Due Date</label>
              <input type="text" placeholder="e.g., Dec 25" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn("rounded-lg border px-3 py-1.5 text-xs outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputFocusBorder, theme.inputFocusRing)} />
            </div>
          </div>
        </>
      )}

      {activeType === "article" && (
        <div className="mb-4">
          <label className={cn("mb-1 block text-xs font-medium", theme.textMuted)}>Tags (comma separated)</label>
          <input type="text" placeholder="e.g., React, JavaScript, Tutorial" value={tags} onChange={(e) => setTags(e.target.value)} className={cn("w-full rounded-lg border px-3 py-2 text-xs outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputFocusBorder, theme.inputFocusRing)} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className={cn("rounded-xl px-5 py-2.5 text-sm font-medium shadow-md transition", theme.accent, theme.accentText, theme.accentHover)}>Save</button>
        <button onClick={onClose} className={cn("rounded-xl px-5 py-2.5 text-sm font-medium transition", theme.textMuted, theme.hoverBg)}>Cancel</button>
      </div>
    </div>
  );
}

// ============ NOTE DETAIL PAGE ============

function NoteDetailPage({
  note,
  onBack,
  onToggleItem,
  onDelete,
  onStatusChange,
  onUpdate,
}: {
  note: Note;
  onBack: () => void;
  onToggleItem: (noteId: number, itemId: number) => void;
  onDelete: (id: number) => void;  // This will be the openDeleteModal function
  onStatusChange: (id: number, status: "todo" | "in-progress" | "done") => void;
  onUpdate: (note: Note) => void;
}) {
  const { theme } = useSettings();
  const nc = useNoteColors();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(
    note.type === "note" ? note.content :
    note.type === "task" ? note.description :
    note.type === "article" ? note.content : ""
  );
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(
    note.type === "task" ? note.priority : "medium"
  );
  const [editDueDate, setEditDueDate] = useState(
    note.type === "task" ? note.dueDate : ""
  );
  const [editTags, setEditTags] = useState(
    note.type === "article" ? note.tags.join(", ") : ""
  );
  const [editCheckItems, setEditCheckItems] = useState<ChecklistItem[]>(
    note.type === "checklist" ? [...note.items] : []
  );
  const [newCheckItem, setNewCheckItem] = useState("");

  const nextStatus: Record<string, "todo" | "in-progress" | "done"> = { todo: "in-progress", "in-progress": "done", done: "todo" };

  const handleSaveEdit = () => {
    let updated: Note;
    switch (note.type) {
      case "checklist":
        updated = { ...note, title: editTitle, items: editCheckItems };
        break;
      case "note":
        updated = { ...note, title: editTitle, content: editContent };
        break;
      case "task":
        updated = { ...note, title: editTitle, description: editContent, priority: editPriority, dueDate: editDueDate || "No date" };
        break;
      case "article":
        updated = { ...note, title: editTitle, content: editContent, tags: editTags.split(",").map((t) => t.trim()).filter(Boolean), readTime: `${Math.max(1, Math.ceil(editContent.trim().split(/\s+/).length / 200))} min read` };
        break;
      default:
        return;
    }
    onUpdate(updated);
    setIsEditing(false);
  };

  const addCheckItemInEdit = () => {
    if (!newCheckItem.trim()) return;
    setEditCheckItems([...editCheckItems, { id: Date.now(), text: newCheckItem.trim(), checked: false }]);
    setNewCheckItem("");
  };

  const removeCheckItemInEdit = (itemId: number) => {
    setEditCheckItems(editCheckItems.filter((i) => i.id !== itemId));
  };

  const toggleCheckItemInEdit = (itemId: number) => {
    setEditCheckItems(editCheckItems.map((i) => i.id === itemId ? { ...i, checked: !i.checked } : i));
  };

  const typeLabel = note.type === "checklist" ? "Checklist" : note.type === "note" ? "Note" : note.type === "task" ? "Task" : "Article";

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all", theme.cardBorder, theme.cardBg, theme.textSecondary, theme.hoverBg)}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className={cn("flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all", isEditing ? "border-amber-500/30 bg-amber-500/10 text-amber-500" : cn(theme.cardBorder, theme.cardBg, theme.textSecondary, theme.hoverBg))}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            {isEditing ? "Editing" : "Edit"}
          </button>
          <button onClick={() => onDelete(note.id)} className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-500/10">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            Delete
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className={cn("overflow-hidden rounded-3xl border shadow-lg", theme.cardBg, theme.cardBorder)}>
        {/* Gradient accent bar */}
        <div className={cn("h-2 bg-gradient-to-r", nc.accentGradient(note.type))} />

        <div className="p-8">
          {/* Badge + date */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider", nc.badgeColor(note.type))}>{typeLabel}</span>
              {note.type === "task" && (
                <>
                  <span className={cn("rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider", nc.priorityColor(isEditing ? editPriority : note.priority))}>
                    {isEditing ? editPriority : note.priority}
                  </span>
                  <button
                    onClick={() => onStatusChange(note.id, nextStatus[note.status])}
                    className={cn("rounded-lg px-3 py-1 text-xs font-bold transition-all hover:opacity-80", nc.statusColor(note.status))}
                  >
                    {STATUS_LABELS[note.status]}
                  </button>
                </>
              )}
            </div>
            <span className={cn("text-sm", theme.textMuted)}>{note.date}</span>
          </div>

          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={cn("mb-6 w-full rounded-xl border px-4 py-3 text-2xl font-bold outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputFocusBorder, theme.inputFocusRing)}
            />
          ) : (
            <h1 className={cn("mb-6 text-2xl font-bold leading-tight", note.type === "task" && note.status === "done" ? cn(theme.textMuted, "line-through") : theme.textPrimary)}>
              {note.title}
            </h1>
          )}

          {/* CHECKLIST DETAIL */}
          {note.type === "checklist" && (
            <div>
              {/* Progress */}
              {(() => {
                const items = isEditing ? editCheckItems : note.items;
                const checkedCount = items.filter((i) => i.checked).length;
                const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
                return (
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={cn("text-sm font-medium", theme.textSecondary)}>{checkedCount} of {items.length} completed</span>
                      <span className="text-sm font-bold text-emerald-500">{Math.round(progress)}%</span>
                    </div>
                    <div className={cn("h-2.5 w-full rounded-full", nc.progressTrack)}>
                      <div className={cn("h-2.5 rounded-full transition-all duration-500", nc.progressBar)} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* Items */}
              <ul className="space-y-2">
                {(isEditing ? editCheckItems : note.items).map((item) => (
                  <li key={item.id} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 transition-all", theme.surfaceBg, theme.surfaceBorder, item.checked && "opacity-60")}>
                    <button
                      onClick={() => isEditing ? toggleCheckItemInEdit(item.id) : onToggleItem(note.id, item.id)}
                      className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all", item.checked ? nc.checkboxActive : nc.checkboxInactive)}
                    >
                      {item.checked && <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                    <span className={cn("flex-1 text-sm", item.checked ? cn(theme.textMuted, "line-through") : theme.textPrimary)}>{item.text}</span>
                    {isEditing && (
                      <button onClick={() => removeCheckItemInEdit(item.id)} className="text-red-400 hover:text-red-500 transition">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {isEditing && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCheckItemInEdit()}
                    placeholder="Add new item..."
                    className={cn("flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)}
                  />
                  <button onClick={addCheckItemInEdit} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition">Add</button>
                </div>
              )}
            </div>
          )}

          {/* STANDARD NOTE DETAIL */}
          {note.type === "note" && (
            isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className={cn("w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)}
              />
            ) : (
              <div className={cn("whitespace-pre-line text-sm leading-relaxed", theme.textSecondary)}>
                {note.content}
              </div>
            )
          )}

          {/* TASK DETAIL */}
          {note.type === "task" && (
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    placeholder="Task description..."
                    className={cn("w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)}
                  />
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className={cn("mb-1.5 block text-xs font-medium", theme.textMuted)}>Priority</label>
                      <div className="flex gap-1.5">
                        {(["low", "medium", "high"] as const).map((p) => (
                          <button key={p} onClick={() => setEditPriority(p)} className={cn("rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition-all", editPriority === p ? cn(nc.priorityColor(p), "ring-2 ring-current/30") : cn(theme.badgeBg, theme.textMuted))}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={cn("mb-1.5 block text-xs font-medium", theme.textMuted)}>Due Date</label>
                      <input type="text" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} placeholder="e.g., Dec 25" className={cn("rounded-lg border px-3.5 py-2 text-xs outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputFocusBorder, theme.inputFocusRing)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className={cn("mb-6 whitespace-pre-line text-sm leading-relaxed", theme.textSecondary)}>{note.description}</p>
                  <div className={cn("flex items-center gap-4 rounded-xl border px-5 py-4", theme.surfaceBg, theme.surfaceBorder)}>
                    <div className="flex items-center gap-2">
                      <svg className={cn("h-4 w-4", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      <span className={cn("text-sm font-medium", theme.textSecondary)}>Due: {note.dueDate}</span>
                    </div>
                    <div className={cn("h-4 w-px", theme.divider)} />
                    <div className="flex items-center gap-2">
                      <svg className={cn("h-4 w-4", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      <span className={cn("text-sm font-medium", theme.textSecondary)}>Status: {STATUS_LABELS[note.status]}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ARTICLE DETAIL */}
          {note.type === "article" && (
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={14}
                    placeholder="Article content..."
                    className={cn("w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)}
                  />
                  <div>
                    <label className={cn("mb-1.5 block text-xs font-medium", theme.textMuted)}>Tags (comma separated)</label>
                    <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g., React, JavaScript" className={cn("w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputFocusBorder, theme.inputFocusRing)} />
                  </div>
                </div>
              ) : (
                <div>
                  {/* Read time */}
                  <div className="mb-5 flex items-center gap-2">
                    <svg className={cn("h-4 w-4", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span className={cn("text-sm", theme.textMuted)}>{note.readTime}</span>
                  </div>

                  <div className={cn("whitespace-pre-line text-sm leading-[1.8]", theme.textSecondary)}>
                    {note.content}
                  </div>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span key={tag} className={cn("rounded-full px-3.5 py-1 text-xs font-semibold", nc.tagBg)}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save/Cancel buttons when editing */}
          {isEditing && (
            <div className="mt-6 flex items-center gap-3 border-t pt-6" style={{ borderColor: "inherit" }}>
              <button onClick={handleSaveEdit} className={cn("rounded-xl px-6 py-2.5 text-sm font-medium shadow-md transition", theme.accent, theme.accentText, theme.accentHover)}>
                Save Changes
              </button>
              <button onClick={() => setIsEditing(false)} className={cn("rounded-xl px-6 py-2.5 text-sm font-medium transition", theme.textMuted, theme.hoverBg)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ NOTE CARD COMPONENTS (for grid view) ============

function ChecklistCard({ note, onToggleItem, onDelete, onClick }: { note: ChecklistNote; onToggleItem: (noteId: number, itemId: number) => void; onDelete: (id: number) => void; onClick: () => void }) {
  const { theme } = useSettings();
  const nc = useNoteColors();
  const checkedCount = note.items.filter((i) => i.checked).length;
  const progress = note.items.length > 0 ? (checkedCount / note.items.length) * 100 : 0;

  return (
    <div onClick={onClick} className={cn("group relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", nc.noteCardBg("checklist"))}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className={cn("absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100 z-10", theme.textMuted, "hover:text-red-500")}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", nc.badgeColor("checklist"))}>Checklist</span>
      </div>
      <h3 className={cn("mb-3 pr-6 font-semibold text-base", theme.textPrimary)}>{note.title}</h3>
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className={cn("text-[11px] font-medium", theme.textMuted)}>{checkedCount}/{note.items.length}</span>
          <span className="text-[11px] font-bold text-emerald-500">{Math.round(progress)}%</span>
        </div>
        <div className={cn("h-1.5 w-full rounded-full", nc.progressTrack)}>
          <div className={cn("h-1.5 rounded-full transition-all duration-300", nc.progressBar)} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ul className="space-y-1.5">
        {note.items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <button onClick={(e) => { e.stopPropagation(); onToggleItem(note.id, item.id); }} className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all", item.checked ? nc.checkboxActive : nc.checkboxInactive)}>
              {item.checked && <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
            <span className={cn("text-sm transition-all", item.checked ? cn(theme.textMuted, "line-through") : theme.textSecondary)}>{item.text}</span>
          </li>
        ))}
        {note.items.length > 4 && (
          <li className={cn("text-xs font-medium pl-6", theme.textMuted)}>+{note.items.length - 4} more items</li>
        )}
      </ul>
      <div className="mt-4 flex items-center justify-between">
        <span className={cn("text-xs font-medium", theme.textMuted)}>{note.date}</span>
        <svg className={cn("h-4 w-4 opacity-0 transition-all group-hover:opacity-50", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </div>
  );
}

function StandardNoteCard({ note, onDelete, onClick }: { note: StandardNote; onDelete: (id: number) => void; onClick: () => void }) {
  const { theme } = useSettings();
  const nc = useNoteColors();
  return (
    <div onClick={onClick} className={cn("group relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", nc.noteCardBg("note"))}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className={cn("absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100 z-10", theme.textMuted, "hover:text-red-500")}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", nc.badgeColor("note"))}>Note</span>
      </div>
      <h3 className={cn("mb-2 pr-6 font-semibold text-base", theme.textPrimary)}>{note.title}</h3>
      <p className={cn("mb-4 whitespace-pre-line text-sm leading-relaxed line-clamp-4", theme.textSecondary)}>{note.content}</p>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", theme.textMuted)}>{note.date}</span>
        <svg className={cn("h-4 w-4 opacity-0 transition-all group-hover:opacity-50", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </div>
  );
}

function TaskCard({ note, onDelete, onStatusChange, onClick }: { note: TaskNote; onDelete: (id: number) => void; onStatusChange: (id: number, status: "todo" | "in-progress" | "done") => void; onClick: () => void }) {
  const { theme } = useSettings();
  const nc = useNoteColors();
  const nextStatus: Record<string, "todo" | "in-progress" | "done"> = { todo: "in-progress", "in-progress": "done", done: "todo" };

  return (
    <div onClick={onClick} className={cn("group relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", nc.noteCardBg("task"))}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className={cn("absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100 z-10", theme.textMuted, "hover:text-red-500")}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", nc.badgeColor("task"))}>Task</span>
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", nc.priorityColor(note.priority))}>{note.priority}</span>
      </div>
      <h3 className={cn("mb-2 pr-6 font-semibold text-base", note.status === "done" ? cn(theme.textMuted, "line-through") : theme.textPrimary)}>{note.title}</h3>
      <p className={cn("mb-4 text-sm leading-relaxed line-clamp-2", theme.textSecondary)}>{note.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(note.id, nextStatus[note.status]); }} className={cn("rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-80", nc.statusColor(note.status))}>
            {STATUS_LABELS[note.status]}
          </button>
          <span className={cn("flex items-center gap-1 text-xs", theme.textMuted)}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            {note.dueDate}
          </span>
        </div>
        <svg className={cn("h-4 w-4 opacity-0 transition-all group-hover:opacity-50", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </div>
  );
}

function ArticleCard({ note, onDelete, onClick }: { note: ArticleNote; onDelete: (id: number) => void; onClick: () => void }) {
  const { theme } = useSettings();
  const nc = useNoteColors();

  return (
    <div onClick={onClick} className={cn("group relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2", nc.noteCardBg("article"))}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className={cn("absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100 z-10", theme.textMuted, "hover:text-red-500")}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", nc.badgeColor("article"))}>Article</span>
        <span className={cn("flex items-center gap-1 text-[11px]", theme.textMuted)}>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          {note.readTime}
        </span>
      </div>
      <h3 className={cn("mb-2 pr-6 font-semibold text-base", theme.textPrimary)}>{note.title}</h3>
      <p className={cn("mb-4 whitespace-pre-line text-sm leading-relaxed line-clamp-3", theme.textSecondary)}>{note.content}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span key={tag} className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", nc.tagBg)}>{tag}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", theme.textMuted)}>{note.date}</span>
          <svg className={cn("h-4 w-4 opacity-0 transition-all group-hover:opacity-50", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN NOTES PAGE ============

export function NotesPage() {
  const { theme } = useSettings();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<NoteCategory>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "loading" | "success" | "error">("idle");
  const { saveNotesToDrive, loadNotesFromDrive, isConnected, autoSync, lastSynced } = useGoogleDrive();

  // Load notes from database on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        const dbNotes = await fetchNotesFromDB();
        const frontendNotes = dbNotes.map(convertDbNoteToFrontend);
        setNotes(frontendNotes);
      } catch (error) {
        console.error('Error loading notes from database:', error);
        // Fallback to initial notes if database fails
        setNotes(initialNotes);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Sync with Google Drive if enabled
  useEffect(() => { 
    if (autoSync && isConnected) { 
      const timer = setTimeout(() => { saveNotesToDrive(notes); }, 2000); 
      return () => clearTimeout(timer); 
    } 
  }, [notes, autoSync, isConnected, saveNotesToDrive]);

  // Keep selectedNote in sync with notes array changes
  useEffect(() => {
    if (selectedNote) {
      const updated = notes.find((n) => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
      else setSelectedNote(null);
    }
  }, [notes, selectedNote]);

  const handleSaveToDrive = async () => { setSyncStatus("saving"); const success = await saveNotesToDrive(notes); setSyncStatus(success ? "success" : "error"); setTimeout(() => setSyncStatus("idle"), 2000); };
  const handleLoadFromDrive = async () => { setSyncStatus("loading"); const loaded = await loadNotesFromDrive(); if (loaded) { setNotes(loaded); setSyncStatus("success"); } else { setSyncStatus("error"); } setTimeout(() => setSyncStatus("idle"), 2000); };

  const counts: Record<NoteCategory, number> = {
    all: notes.length,
    checklist: notes.filter((n) => n.type === "checklist").length,
    note: notes.filter((n) => n.type === "note").length,
    task: notes.filter((n) => n.type === "task").length,
    article: notes.filter((n) => n.type === "article").length,
  };

  const filteredNotes = (activeCategory === "all" ? notes : notes.filter((n) => n.type === activeCategory)).filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (n.title.toLowerCase().includes(q)) return true;
    if (n.type === "note" && n.content.toLowerCase().includes(q)) return true;
    if (n.type === "task" && n.description.toLowerCase().includes(q)) return true;
    if (n.type === "article" && (n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)))) return true;
    if (n.type === "checklist" && n.items.some(i => i.text.toLowerCase().includes(q))) return true;
    return false;
  });

  const openDeleteModal = (id: number) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (noteToDelete !== null) {
      try {
        await deleteNoteFromDB(noteToDelete);
        setNotes(notes.filter((n) => n.id !== noteToDelete));
        // If we're currently viewing the note that was deleted, go back to the list
        if (selectedNote && selectedNote.id === noteToDelete) {
          setSelectedNote(null);
        }
      } catch (error) {
        console.error('Error deleting note from database:', error);
        alert('Failed to delete note. Please try again.');
      } finally {
        setDeleteModalOpen(false);
        setNoteToDelete(null);
      }
    }
  };
  const toggleChecklistItem = (noteId: number, itemId: number) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) => {
        if (n.id === noteId && n.type === "checklist") {
          const updatedItems = n.items.map((item) => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
          );
          const updatedNote = { ...n, items: updatedItems };
          return updatedNote;
        }
        return n;
      });
      
      // Get the updated note for database update
      const updatedNote = updatedNotes.find(n => n.id === noteId);
      if (updatedNote) {
        updateNoteInDatabase(updatedNote);
      }
      
      return updatedNotes;
    });
  };
  
  const changeTaskStatus = (id: number, status: "todo" | "in-progress" | "done") => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) => { 
        if (n.id === id && n.type === "task") {
          return { ...n, status };
        } 
        return n; 
      });
      
      // Get the updated note for database update
      const updatedNote = updatedNotes.find(n => n.id === id);
      if (updatedNote && updatedNote.type === "task") {
        updateNoteInDatabase(updatedNote);
      }
      
      return updatedNotes;
    });
  };
  
  const addNote = async (note: Note) => {
    try {
      // Save to database
      const dbNote = await saveNoteToDB(convertFrontendNoteToDb(note));
      // Add to local state with the new ID from the database
      const noteWithId = { ...note, id: dbNote.id! };
      setNotes([noteWithId, ...notes]);
    } catch (error) {
      console.error('Error adding note to database:', error);
      // Show error to user
      alert('Failed to save note. Please try again.');
    }
  };
  
  const updateNote = async (updatedNote: Note) => {
    // Optimistically update UI first
    setNotes(notes.map((n) => n.id === updatedNote.id ? updatedNote : n));
    
    // Update in database
    try {
      console.log('Calling updateNoteInDatabase with:', updatedNote);
      await updateNoteInDatabase(updatedNote);
      console.log('Update successful');
    } catch (error) {
      console.error('Error updating note in database:', error);
      alert('Failed to update note. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      // Optionally: revert the optimistic update here
    }
  };
  
  const updateNoteInDatabase = async (note: Note) => {
    try {
      await updateNoteInDB(note.id, convertFrontendNoteToDb(note));
    } catch (error) {
      console.error('Error updating note in database:', error);
      throw error; // Re-throw so caller can handle it
    }
  };

  // Function to handle deletion from the detail view
  const handleDeleteFromDetail = (id: number) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  // ============ DETAIL VIEW ============
  if (selectedNote) {
    return (
      <>
        <NoteDetailPage
          note={selectedNote}
          onBack={() => setSelectedNote(null)}
          onToggleItem={toggleChecklistItem}
          onDelete={handleDeleteFromDetail}
          onStatusChange={changeTaskStatus}
          onUpdate={updateNote}
        />
        {/* Delete Confirmation Modal - Also needed in detail view */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Note"
          onConfirm={confirmDelete}
          confirmText="Delete"
          cancelText="Cancel"
        >
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
        </Modal>
      </>
    );
  }

  // ============ LIST VIEW ============
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", theme.textPrimary)}>Notes</h1>
          <p className={cn("mt-1 text-sm", theme.textMuted)}>Organize your thoughts, tasks, and ideas</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <div className="flex items-center gap-1.5">
              <button onClick={handleSaveToDrive} disabled={syncStatus === "saving"} className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all", syncStatus === "saving" ? cn(theme.badgeBg, theme.textMuted) : cn(theme.cardBorder, theme.cardBg, theme.textSecondary, theme.hoverBg))}>
                <svg className={cn("h-3.5 w-3.5", syncStatus === "saving" && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{syncStatus === "saving" ? <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" /> : <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>}</svg>
                {syncStatus === "saving" ? "Saving..." : "Save to Drive"}
              </button>
              <button onClick={handleLoadFromDrive} disabled={syncStatus === "loading"} className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all", syncStatus === "loading" ? cn(theme.badgeBg, theme.textMuted) : cn(theme.cardBorder, theme.cardBg, theme.textSecondary, theme.hoverBg))}>
                <svg className={cn("h-3.5 w-3.5", syncStatus === "loading" && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{syncStatus === "loading" ? <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" /> : <><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></>}</svg>
                {syncStatus === "loading" ? "Loading..." : "Load from Drive"}
              </button>
              {syncStatus === "success" && <span className="flex items-center gap-1 text-xs text-emerald-500"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>Synced</span>}
              {syncStatus === "error" && <span className="flex items-center gap-1 text-xs text-red-500"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Failed</span>}
            </div>
          )}
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
              isCreating ? cn(theme.badgeBg, theme.textSecondary) : cn(theme.accent, theme.accentText, "shadow-md", theme.accentHover)
            )}
          >
            {isCreating ? (
              <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Cancel</>
            ) : (
              <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>New Note</>
            )}
          </button>
        </div>
      </div>

      {/* Drive sync info */}
      {isConnected && lastSynced && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          <span className="text-xs text-emerald-500">Connected to Google Drive {autoSync && "(auto-sync on)"} &bull; Last synced: {lastSynced}</span>
        </div>
      )}
      {!isConnected && (
        <div className={cn("mb-5 flex items-center gap-2 rounded-xl border px-4 py-2", theme.surfaceBorder, theme.surfaceBg)}>
          <svg className={cn("h-4 w-4", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          <span className={cn("text-xs", theme.textMuted)}>Google Drive not connected. Notes saved locally. Configure in Settings.</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className={cn("mb-6 flex flex-wrap gap-2 rounded-2xl border p-2", theme.cardBg, theme.cardBorder)}>
        {categoryTabs.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
              activeCategory === cat.key
                ? cn(theme.tabActiveBg, theme.tabActiveText, "shadow-sm")
                : cn(theme.tabInactiveText, theme.hoverBg)
            )}
          >
            {cat.icon}
            <span>{cat.label}</span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
              activeCategory === cat.key ? "bg-white/20" : cn(theme.badgeBg)
            )}>
              {counts[cat.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className={cn("mb-6 relative")}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg className={cn("h-4 w-4", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes, tasks, articles..."
          className={cn("w-full rounded-xl border py-3 pl-11 pr-10 text-sm outline-none transition focus:ring-2", theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className={cn("absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1", theme.textMuted, theme.hoverBg)}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      {/* Search Results Count */}
      {searchQuery && (
        <div className={cn("mb-4 flex items-center gap-2 text-sm", theme.textMuted)}>
          <span>Found <strong className={theme.textPrimary}>{filteredNotes.length}</strong> result{filteredNotes.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;</span>
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <CreateForm type={activeCategory} onClose={() => setIsCreating(false)} onSave={(note) => { addNote(note); setIsCreating(false); }} />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-2xl", theme.surfaceBg)}>
            <svg className={cn("h-8 w-8 animate-spin", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" />
            </svg>
          </div>
          <h3 className={cn("text-lg font-semibold", theme.textSecondary)}>Loading notes...</h3>
        </div>
      )}

      {/* Notes Grid */}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => {
            switch (note.type) {
              case "checklist": return <ChecklistCard key={note.id} note={note} onToggleItem={toggleChecklistItem} onDelete={openDeleteModal} onClick={() => setSelectedNote(note)} />;
              case "note": return <StandardNoteCard key={note.id} note={note} onDelete={openDeleteModal} onClick={() => setSelectedNote(note)} />;
              case "task": return <TaskCard key={note.id} note={note} onDelete={openDeleteModal} onStatusChange={changeTaskStatus} onClick={() => setSelectedNote(note)} />;
              case "article": return <ArticleCard key={note.id} note={note} onDelete={openDeleteModal} onClick={() => setSelectedNote(note)} />;
            }
          })}
        </div>
      )}

      {!isLoading && filteredNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-2xl", theme.surfaceBg)}>
            <svg className={cn("h-8 w-8", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14,2 14,8 20,8" /></svg>
          </div>
          <h3 className={cn("text-lg font-semibold", theme.textSecondary)}>No {activeCategory === "all" ? "" : activeCategory + " "}items yet</h3>
          <p className={cn("mt-1 text-sm", theme.textMuted)}>Click "New Note" to create one</p>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Note"
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this note? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
