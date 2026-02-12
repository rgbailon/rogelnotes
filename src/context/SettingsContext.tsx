import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ============ AI PROVIDER TYPES ============

export interface AIModel {
  id: string;
  name: string;
  tier: "free" | "pro";
  description: string;
}

export interface AIProvider {
  id: string;
  name: string;
  icon: string;
  apiKeyPlaceholder: string;
  baseUrlEditable: boolean;
  defaultBaseUrl: string;
  models: AIModel[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🌐",
    apiKeyPlaceholder: "sk-or-v1-xxxxxxxxxxxxxxxx",
    baseUrlEditable: false,
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    models: [
      // Free models (verified working on OpenRouter)
      { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1 0528", tier: "free", description: "Latest DeepSeek reasoning model, free tier" },
      { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3 0324", tier: "free", description: "DeepSeek V3 chat, fast and capable" },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", tier: "free", description: "Google's open model, 27B parameters" },
      { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B", tier: "free", description: "Google's mid-size 12B model" },
      { id: "google/gemma-3-4b-it:free", name: "Gemma 3 4B", tier: "free", description: "Google's lightweight 4B model" },
      { id: "google/gemma-3-1b-it:free", name: "Gemma 3 1B", tier: "free", description: "Google's tiniest model, ultra fast" },
      { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 Maverick", tier: "free", description: "Meta's latest Llama 4 model" },
      { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout", tier: "free", description: "Meta's efficient Llama 4 scout" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", tier: "free", description: "Meta's high quality 70B model, free" },
      { id: "qwen/qwen3-235b-a22b:free", name: "Qwen 3 235B A22B", tier: "free", description: "Alibaba's massive 235B MoE model" },
      { id: "qwen/qwen3-30b-a3b:free", name: "Qwen 3 30B A3B", tier: "free", description: "Efficient Qwen 3, 3B active params" },
      { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 24B", tier: "free", description: "Mistral's efficient 24B instruct" },
      { id: "microsoft/mai-ds-r1:free", name: "Microsoft MAI DS R1", tier: "free", description: "Microsoft's reasoning model" },
      { id: "nvidia/llama-3.1-nemotron-ultra-253b-v1:free", name: "Nemotron Ultra 253B", tier: "free", description: "NVIDIA's massive reasoning model" },
      // Pro models
      { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", tier: "pro", description: "Anthropic's latest, best reasoning & coding" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", tier: "pro", description: "Top-tier reasoning and coding" },
      { id: "openai/gpt-4o", name: "GPT-4o", tier: "pro", description: "OpenAI's flagship multimodal model" },
      { id: "openai/gpt-4.1", name: "GPT-4.1", tier: "pro", description: "OpenAI's latest GPT-4 series model" },
      { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", tier: "pro", description: "OpenAI's efficient GPT-4.1 model" },
      { id: "openai/o3-mini", name: "O3 Mini", tier: "pro", description: "OpenAI's compact reasoning model" },
      { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro", tier: "pro", description: "Google's most capable model" },
      { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash", tier: "pro", description: "Google's fast + smart model" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tier: "pro", description: "Full DeepSeek R1 reasoning model" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", tier: "pro", description: "Meta's high quality 70B model" },
      { id: "mistralai/mistral-large-2411", name: "Mistral Large", tier: "pro", description: "Mistral's most capable model" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "💎",
    apiKeyPlaceholder: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx",
    baseUrlEditable: false,
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tier: "free", description: "Fast, free, multimodal model" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", tier: "free", description: "Lightest and fastest Gemini model" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tier: "free", description: "Reliable fast model with 1M context" },
      { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", tier: "free", description: "Smallest Gemini for quick tasks" },
      { id: "gemini-2.5-pro-preview-06-05", name: "Gemini 2.5 Pro", tier: "pro", description: "Most capable Gemini, best reasoning" },
      { id: "gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash", tier: "pro", description: "Fast + thinking, great balance" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tier: "pro", description: "Strong reasoning, 2M context window" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🔍",
    apiKeyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
    baseUrlEditable: false,
    defaultBaseUrl: "https://api.deepseek.com",
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3 0324", tier: "free", description: "Latest general chat model, very capable" },
      { id: "deepseek-reasoner", name: "DeepSeek R1", tier: "free", description: "Advanced chain-of-thought reasoning" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    icon: "⚡",
    apiKeyPlaceholder: "gsk_xxxxxxxxxxxxxxxxxxxxxxxx",
    baseUrlEditable: false,
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    models: [
      // Free tier models (all Groq models are free with rate limits)
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", tier: "free", description: "Meta's latest 70B, very fast on Groq" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", tier: "free", description: "Ultra fast 8B model, great for quick tasks" },
      { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B Preview", tier: "free", description: "Compact 3B model, lightning fast" },
      { id: "llama-3.2-1b-preview", name: "Llama 3.2 1B Preview", tier: "free", description: "Tiniest Llama, fastest responses" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B IT", tier: "free", description: "Google's 9B instruction-tuned model" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", tier: "free", description: "Mistral's MoE model, 32K context" },
      { id: "llama3-70b-8192", name: "Llama 3 70B", tier: "free", description: "Original Llama 3 70B, 8K context" },
      { id: "llama3-8b-8192", name: "Llama 3 8B", tier: "free", description: "Original Llama 3 8B, 8K context" },
      // Pro tier (higher rate limits, priority access)
      { id: "llama-3.3-70b-specdec", name: "Llama 3.3 70B SpecDec", tier: "pro", description: "Speculative decoding, even faster" },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B", tier: "pro", description: "DeepSeek reasoning distilled into Llama" },
      { id: "qwen-qwq-32b", name: "Qwen QwQ 32B", tier: "pro", description: "Alibaba's reasoning model" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", tier: "pro", description: "Meta's Llama 4 scout model" },
    ],
  },
];

// ============ THEME TYPES ============

export interface ThemeColors {
  // Background
  pageBg: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
  cardBorder: string;
  surfaceBg: string;
  surfaceBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  inputFocusRing: string;
  inputText: string;
  inputPlaceholder: string;
  // Tab / Nav
  tabBg: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent
  accent: string;
  accentHover: string;
  accentText: string;
  accentGradientFrom: string;
  accentGradientTo: string;
  // Chat
  userBubbleBg: string;
  userBubbleText: string;
  botBubbleBg: string;
  botBubbleBorder: string;
  botBubbleText: string;
  // Misc
  hoverBg: string;
  divider: string;
  badgeBg: string;
  badgeText: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
}

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  preview: string[];  // 4 color swatches for preview
  colors: ThemeColors;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "light",
    name: "Light",
    description: "Clean and bright default theme",
    preview: ["#ffffff", "#f8fafc", "#6366f1", "#334155"],
    colors: {
      pageBg: "bg-gradient-to-br from-slate-50 via-white to-zinc-100",
      headerBg: "bg-white/80",
      headerBorder: "border-slate-200",
      cardBg: "bg-white",
      cardBorder: "border-slate-200",
      surfaceBg: "bg-slate-50/50",
      surfaceBorder: "border-slate-200",
      inputBg: "bg-slate-50",
      inputBorder: "border-slate-200",
      inputFocusBorder: "focus:border-indigo-300",
      inputFocusRing: "focus:ring-indigo-100",
      inputText: "text-slate-900",
      inputPlaceholder: "placeholder-slate-400",
      tabBg: "bg-slate-100",
      tabActiveBg: "bg-white",
      tabActiveText: "text-slate-900",
      tabInactiveText: "text-slate-500",
      textPrimary: "text-slate-900",
      textSecondary: "text-slate-600",
      textMuted: "text-slate-400",
      accent: "bg-gradient-to-r from-violet-500 to-indigo-600",
      accentHover: "hover:shadow-indigo-300",
      accentText: "text-white",
      accentGradientFrom: "from-violet-500",
      accentGradientTo: "to-indigo-600",
      userBubbleBg: "bg-gradient-to-r from-violet-500 to-indigo-600",
      userBubbleText: "text-white",
      botBubbleBg: "bg-white",
      botBubbleBorder: "border-slate-200",
      botBubbleText: "text-slate-800",
      hoverBg: "hover:bg-slate-50",
      divider: "border-slate-200",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-500",
      scrollbarTrack: "bg-slate-100",
      scrollbarThumb: "bg-slate-300",
    },
  },
  {
    id: "netflix",
    name: "Netflix",
    description: "Dark with signature red accents",
    preview: ["#141414", "#1a1a1a", "#e50914", "#ffffff"],
    colors: {
      pageBg: "bg-[#141414]",
      headerBg: "bg-[#141414]/95",
      headerBorder: "border-[#2a2a2a]",
      cardBg: "bg-[#1a1a1a]",
      cardBorder: "border-[#2a2a2a]",
      surfaceBg: "bg-[#1a1a1a]",
      surfaceBorder: "border-[#2a2a2a]",
      inputBg: "bg-[#222222]",
      inputBorder: "border-[#333333]",
      inputFocusBorder: "focus:border-[#e50914]",
      inputFocusRing: "focus:ring-[#e50914]/20",
      inputText: "text-white",
      inputPlaceholder: "placeholder-gray-500",
      tabBg: "bg-[#1a1a1a]",
      tabActiveBg: "bg-[#e50914]",
      tabActiveText: "text-white",
      tabInactiveText: "text-gray-400",
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
      textMuted: "text-gray-500",
      accent: "bg-[#e50914]",
      accentHover: "hover:shadow-red-900/50",
      accentText: "text-white",
      accentGradientFrom: "from-[#e50914]",
      accentGradientTo: "to-[#b81d24]",
      userBubbleBg: "bg-[#e50914]",
      userBubbleText: "text-white",
      botBubbleBg: "bg-[#222222]",
      botBubbleBorder: "border-[#333333]",
      botBubbleText: "text-gray-100",
      hoverBg: "hover:bg-[#222222]",
      divider: "border-[#2a2a2a]",
      badgeBg: "bg-[#222222]",
      badgeText: "text-gray-400",
      scrollbarTrack: "bg-[#1a1a1a]",
      scrollbarThumb: "bg-[#444444]",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Sleek dark mode with blue accents",
    preview: ["#0f172a", "#1e293b", "#3b82f6", "#e2e8f0"],
    colors: {
      pageBg: "bg-[#0f172a]",
      headerBg: "bg-[#0f172a]/95",
      headerBorder: "border-slate-700",
      cardBg: "bg-slate-800",
      cardBorder: "border-slate-700",
      surfaceBg: "bg-slate-800/50",
      surfaceBorder: "border-slate-700",
      inputBg: "bg-slate-800",
      inputBorder: "border-slate-600",
      inputFocusBorder: "focus:border-blue-500",
      inputFocusRing: "focus:ring-blue-500/20",
      inputText: "text-slate-100",
      inputPlaceholder: "placeholder-slate-500",
      tabBg: "bg-slate-800",
      tabActiveBg: "bg-blue-600",
      tabActiveText: "text-white",
      tabInactiveText: "text-slate-400",
      textPrimary: "text-slate-100",
      textSecondary: "text-slate-300",
      textMuted: "text-slate-500",
      accent: "bg-blue-600",
      accentHover: "hover:shadow-blue-900/50",
      accentText: "text-white",
      accentGradientFrom: "from-blue-600",
      accentGradientTo: "to-blue-700",
      userBubbleBg: "bg-blue-600",
      userBubbleText: "text-white",
      botBubbleBg: "bg-slate-800",
      botBubbleBorder: "border-slate-700",
      botBubbleText: "text-slate-100",
      hoverBg: "hover:bg-slate-700",
      divider: "border-slate-700",
      badgeBg: "bg-slate-700",
      badgeText: "text-slate-400",
      scrollbarTrack: "bg-slate-800",
      scrollbarThumb: "bg-slate-600",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Popular dark theme with vibrant colors",
    preview: ["#282a36", "#44475a", "#bd93f9", "#f8f8f2"],
    colors: {
      pageBg: "bg-[#282a36]",
      headerBg: "bg-[#282a36]/95",
      headerBorder: "border-[#44475a]",
      cardBg: "bg-[#21222c]",
      cardBorder: "border-[#44475a]",
      surfaceBg: "bg-[#21222c]",
      surfaceBorder: "border-[#44475a]",
      inputBg: "bg-[#21222c]",
      inputBorder: "border-[#44475a]",
      inputFocusBorder: "focus:border-[#bd93f9]",
      inputFocusRing: "focus:ring-[#bd93f9]/20",
      inputText: "text-[#f8f8f2]",
      inputPlaceholder: "placeholder-[#6272a4]",
      tabBg: "bg-[#21222c]",
      tabActiveBg: "bg-[#bd93f9]",
      tabActiveText: "text-[#282a36]",
      tabInactiveText: "text-[#6272a4]",
      textPrimary: "text-[#f8f8f2]",
      textSecondary: "text-[#f8f8f2]/80",
      textMuted: "text-[#6272a4]",
      accent: "bg-[#bd93f9]",
      accentHover: "hover:shadow-purple-900/50",
      accentText: "text-[#282a36]",
      accentGradientFrom: "from-[#bd93f9]",
      accentGradientTo: "to-[#ff79c6]",
      userBubbleBg: "bg-gradient-to-r from-[#bd93f9] to-[#ff79c6]",
      userBubbleText: "text-[#282a36]",
      botBubbleBg: "bg-[#44475a]",
      botBubbleBorder: "border-[#6272a4]",
      botBubbleText: "text-[#f8f8f2]",
      hoverBg: "hover:bg-[#44475a]",
      divider: "border-[#44475a]",
      badgeBg: "bg-[#44475a]",
      badgeText: "text-[#6272a4]",
      scrollbarTrack: "bg-[#21222c]",
      scrollbarThumb: "bg-[#44475a]",
    },
  },
  {
    id: "onedark",
    name: "One Dark",
    description: "Atom-inspired dark theme with warm tones",
    preview: ["#282c34", "#3e4452", "#61afef", "#abb2bf"],
    colors: {
      pageBg: "bg-[#282c34]",
      headerBg: "bg-[#282c34]/95",
      headerBorder: "border-[#3e4452]",
      cardBg: "bg-[#21252b]",
      cardBorder: "border-[#3e4452]",
      surfaceBg: "bg-[#21252b]",
      surfaceBorder: "border-[#3e4452]",
      inputBg: "bg-[#21252b]",
      inputBorder: "border-[#3e4452]",
      inputFocusBorder: "focus:border-[#61afef]",
      inputFocusRing: "focus:ring-[#61afef]/20",
      inputText: "text-[#abb2bf]",
      inputPlaceholder: "placeholder-[#5c6370]",
      tabBg: "bg-[#21252b]",
      tabActiveBg: "bg-[#61afef]",
      tabActiveText: "text-[#282c34]",
      tabInactiveText: "text-[#5c6370]",
      textPrimary: "text-[#abb2bf]",
      textSecondary: "text-[#abb2bf]/80",
      textMuted: "text-[#5c6370]",
      accent: "bg-[#61afef]",
      accentHover: "hover:shadow-blue-900/50",
      accentText: "text-[#282c34]",
      accentGradientFrom: "from-[#61afef]",
      accentGradientTo: "to-[#56b6c2]",
      userBubbleBg: "bg-gradient-to-r from-[#61afef] to-[#56b6c2]",
      userBubbleText: "text-[#282c34]",
      botBubbleBg: "bg-[#3e4452]",
      botBubbleBorder: "border-[#5c6370]",
      botBubbleText: "text-[#abb2bf]",
      hoverBg: "hover:bg-[#3e4452]",
      divider: "border-[#3e4452]",
      badgeBg: "bg-[#3e4452]",
      badgeText: "text-[#5c6370]",
      scrollbarTrack: "bg-[#21252b]",
      scrollbarThumb: "bg-[#3e4452]",
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    description: "Classic editor theme with vivid highlights",
    preview: ["#272822", "#3e3d32", "#a6e22e", "#f8f8f2"],
    colors: {
      pageBg: "bg-[#272822]",
      headerBg: "bg-[#272822]/95",
      headerBorder: "border-[#3e3d32]",
      cardBg: "bg-[#1e1f1c]",
      cardBorder: "border-[#3e3d32]",
      surfaceBg: "bg-[#1e1f1c]",
      surfaceBorder: "border-[#3e3d32]",
      inputBg: "bg-[#1e1f1c]",
      inputBorder: "border-[#3e3d32]",
      inputFocusBorder: "focus:border-[#a6e22e]",
      inputFocusRing: "focus:ring-[#a6e22e]/20",
      inputText: "text-[#f8f8f2]",
      inputPlaceholder: "placeholder-[#75715e]",
      tabBg: "bg-[#1e1f1c]",
      tabActiveBg: "bg-[#a6e22e]",
      tabActiveText: "text-[#272822]",
      tabInactiveText: "text-[#75715e]",
      textPrimary: "text-[#f8f8f2]",
      textSecondary: "text-[#f8f8f2]/80",
      textMuted: "text-[#75715e]",
      accent: "bg-[#a6e22e]",
      accentHover: "hover:shadow-green-900/50",
      accentText: "text-[#272822]",
      accentGradientFrom: "from-[#a6e22e]",
      accentGradientTo: "to-[#66d9ef]",
      userBubbleBg: "bg-gradient-to-r from-[#a6e22e] to-[#66d9ef]",
      userBubbleText: "text-[#272822]",
      botBubbleBg: "bg-[#3e3d32]",
      botBubbleBorder: "border-[#75715e]",
      botBubbleText: "text-[#f8f8f2]",
      hoverBg: "hover:bg-[#3e3d32]",
      divider: "border-[#3e3d32]",
      badgeBg: "bg-[#3e3d32]",
      badgeText: "text-[#75715e]",
      scrollbarTrack: "bg-[#1e1f1c]",
      scrollbarThumb: "bg-[#3e3d32]",
    },
  },
];

// ============ SETTINGS STATE ============

export interface AISettings {
  providerId: string;
  apiKey: string;
  baseUrl: string;
  selectedModelId: string;
  systemPrompt: string;
  validated: boolean;
  validationMessage: string;
}

export interface GoogleDriveSettings {
  apiKey: string;
  clientId: string;
  connected: boolean;
  folderId: string;
  autoSync: boolean;
  lastSynced: string | null;
}

interface SettingsContextType {
  aiSettings: AISettings;
  setAISettings: (settings: AISettings) => void;
  driveSettings: GoogleDriveSettings;
  setDriveSettings: (settings: GoogleDriveSettings) => void;
  themeId: string;
  setThemeId: (id: string) => void;
  theme: ThemeColors;
  getProvider: () => AIProvider;
  getModel: () => AIModel | undefined;
  isAIReady: () => boolean;
}

const defaultAISettings: AISettings = {
  providerId: "openrouter",
  apiKey: "",
  baseUrl: "https://openrouter.ai/api/v1",
  selectedModelId: "deepseek/deepseek-r1-0528:free",
  systemPrompt: "You are a helpful assistant. Be concise and clear in your responses. Do not use HTML tags in your replies — use plain text only.",
  validated: false,
  validationMessage: "",
};

const defaultDriveSettings: GoogleDriveSettings = {
  apiKey: "",
  clientId: "",
  connected: false,
  folderId: "",
  autoSync: false,
  lastSynced: null,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return fallback;
}

export function getThemeColors(themeId: string): ThemeColors {
  const theme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
  return theme.colors;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [aiSettings, setAISettingsState] = useState<AISettings>(() =>
    loadFromStorage("ai_settings", defaultAISettings)
  );
  const [driveSettings, setDriveSettingsState] = useState<GoogleDriveSettings>(() =>
    loadFromStorage("drive_settings", defaultDriveSettings)
  );
  const [themeId, setThemeIdState] = useState<string>(() =>
    loadFromStorage("theme_id", "light")
  );

  const theme = getThemeColors(themeId);

  useEffect(() => {
    localStorage.setItem("ai_settings", JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    localStorage.setItem("drive_settings", JSON.stringify(driveSettings));
  }, [driveSettings]);

  useEffect(() => {
    localStorage.setItem("theme_id", JSON.stringify(themeId));
  }, [themeId]);

  const setAISettings = (settings: AISettings) => {
    setAISettingsState(settings);
  };

  const setDriveSettings = (settings: GoogleDriveSettings) => {
    setDriveSettingsState(settings);
  };

  const setThemeId = (id: string) => {
    setThemeIdState(id);
  };

  const getProvider = () => {
    return AI_PROVIDERS.find((p) => p.id === aiSettings.providerId) || AI_PROVIDERS[0];
  };

  const getModel = () => {
    const provider = getProvider();
    return provider.models.find((m) => m.id === aiSettings.selectedModelId);
  };

  const isAIReady = () => {
    return !!(aiSettings.apiKey && aiSettings.validated);
  };

  return (
    <SettingsContext.Provider
      value={{ aiSettings, setAISettings, driveSettings, setDriveSettings, themeId, setThemeId, theme, getProvider, getModel, isAIReady }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

// ============ API VALIDATION ============

export async function validateAPIKey(
  providerId: string,
  apiKey: string,
  baseUrl: string,
  modelId: string
): Promise<{ valid: boolean; message: string }> {
  try {
    let validationResponse;
    
    if (providerId === "gemini") {
      const url = `${baseUrl}/models/${modelId}?key=${apiKey}`;
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        validationResponse = { valid: true, message: "API key validated successfully. Gemini is ready to use." };
      } else {
        const data = await res.json().catch(() => null);
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        validationResponse = { valid: false, message: `Validation failed: ${errMsg}` };
      }
    } else if (providerId === "groq") {
      const url = "https://api.groq.com/openai/v1/models";
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        validationResponse = { valid: true, message: "Groq API key validated. Lightning-fast inference ready!" };
      } else if (res.status === 401) {
        validationResponse = { valid: false, message: "Invalid Groq API key. Get one at console.groq.com" };
      } else {
        const data = await res.json().catch(() => null);
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        validationResponse = { valid: false, message: `Validation failed: ${errMsg}` };
      }
    } else {
      // OpenRouter and DeepSeek — OpenAI-compatible validation
      let url: string;
      if (providerId === "openrouter") {
        url = "https://openrouter.ai/api/v1/models";
      } else if (providerId === "deepseek") {
        url = "https://api.deepseek.com/v1/models";
      } else {
        const cleanBase = baseUrl.replace(/\/+$/, "");
        url = `${cleanBase}/models`;
      }
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
      };
      if (providerId === "openrouter") {
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "Workspace App";
      }

      const res = await fetch(url, { method: "GET", headers });
      if (res.ok) {
        validationResponse = { valid: true, message: "API key validated successfully. Ready to chat." };
      } else if (res.status === 401 || res.status === 403) {
        validationResponse = { valid: false, message: "Invalid API key. Please check and try again." };
      } else {
        const data = await res.json().catch(() => null);
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        validationResponse = { valid: false, message: `Validation failed: ${errMsg}` };
      }
    }

    // If validation was successful, send the API key to the backend
    if (validationResponse.valid) {
      try {
        const { sendApiValidation } = await import("../utils/apiUtils");
        const backendResponse = await sendApiValidation(apiKey);
        if (!backendResponse.success) {
          console.warn('Backend API validation failed:', backendResponse.error);
          // We don't want to fail the overall validation just because the backend call failed
        }
      } catch (backendError) {
        console.warn('Error sending API validation to backend:', backendError);
        // We don't want to fail the overall validation just because the backend call failed
      }
    }

    return validationResponse;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      if (providerId === "ollama") {
        return { valid: false, message: "Cannot reach Ollama. This is likely a CORS issue. You need to set OLLAMA_ORIGINS=\"*\" before starting Ollama. See the setup instructions below for your OS." };
      }
      return { valid: false, message: "Network error. Please check your internet connection and try again." };
    }
    return { valid: false, message: `Connection error: ${errorMessage}` };
  }
}
