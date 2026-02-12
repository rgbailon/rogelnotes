import { useState } from "react";
import { cn } from "@/utils/cn";
import { useSettings, AI_PROVIDERS, APP_THEMES, validateAPIKey, type AISettings } from "@/context/SettingsContext";

type SettingsTab = "theme" | "ai" | "drive";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("theme");
  const { theme } = useSettings();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className={cn("text-2xl font-bold", theme.textPrimary)}>Settings</h1>
        <p className={cn("mt-1 text-sm", theme.textMuted)}>
          Configure your theme, AI chatbot, and cloud storage
        </p>
      </div>

      {/* Tabs */}
      <div className={cn("mb-8 flex gap-2 border-b pb-px", theme.divider)}>
        <button
          onClick={() => setActiveTab("theme")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-all",
            activeTab === "theme"
              ? cn("border-current", theme.textPrimary)
              : cn("border-transparent", theme.tabInactiveText)
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="10.5" r="2.5" />
            <circle cx="8.5" cy="7.5" r="2.5" />
            <circle cx="6.5" cy="12.5" r="2.5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          Themes
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-all",
            activeTab === "ai"
              ? cn("border-current", theme.textPrimary)
              : cn("border-transparent", theme.tabInactiveText)
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
            <circle cx="12" cy="15" r="2" />
          </svg>
          AI Chatbot
        </button>
        <button
          onClick={() => setActiveTab("drive")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-all",
            activeTab === "drive"
              ? cn("border-current", theme.textPrimary)
              : cn("border-transparent", theme.tabInactiveText)
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12H16L14 15H10L8 12H2" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          Google Drive
        </button>
      </div>

      {activeTab === "theme" && <ThemeSettingsPanel />}
      {activeTab === "ai" && <AISettingsPanel />}
      {activeTab === "drive" && <DriveSettingsPanel />}
    </div>
  );
}

// ============ THEME SETTINGS PANEL ============

function ThemeSettingsPanel() {
  const { themeId, setThemeId, theme } = useSettings();

  return (
    <div className="space-y-8">
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>Appearance</h2>
        <p className={cn("mb-6 text-sm", theme.textMuted)}>
          Choose a color theme for your workspace
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APP_THEMES.map((t) => {
            const isActive = themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 p-0 text-left transition-all duration-300",
                  isActive
                    ? "border-current ring-2 ring-current/20 shadow-lg scale-[1.02]"
                    : cn(theme.cardBorder, "hover:scale-[1.01] hover:shadow-md"),
                  isActive ? theme.textPrimary : ""
                )}
              >
                {/* Theme Preview Header */}
                <div
                  className="relative h-28 w-full"
                  style={{ backgroundColor: t.preview[0] }}
                >
                  {/* Simulated UI Preview */}
                  <div className="absolute inset-x-3 top-3 flex items-center gap-2">
                    {/* Mini header bar */}
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: t.preview[2] }}
                    />
                    <div
                      className="h-2 w-12 rounded"
                      style={{ backgroundColor: t.preview[3], opacity: 0.3 }}
                    />
                    <div className="ml-auto flex gap-1">
                      <div
                        className="h-2 w-8 rounded"
                        style={{ backgroundColor: t.preview[2], opacity: 0.6 }}
                      />
                      <div
                        className="h-2 w-8 rounded"
                        style={{ backgroundColor: t.preview[3], opacity: 0.2 }}
                      />
                    </div>
                  </div>
                  {/* Mini cards */}
                  <div className="absolute inset-x-3 top-10 grid grid-cols-3 gap-2">
                    <div
                      className="h-14 rounded-lg"
                      style={{ backgroundColor: t.preview[1] }}
                    >
                      <div className="p-2">
                        <div
                          className="mb-1 h-1.5 w-8 rounded"
                          style={{ backgroundColor: t.preview[3], opacity: 0.4 }}
                        />
                        <div
                          className="h-1 w-12 rounded"
                          style={{ backgroundColor: t.preview[3], opacity: 0.2 }}
                        />
                      </div>
                    </div>
                    <div
                      className="h-14 rounded-lg"
                      style={{ backgroundColor: t.preview[1] }}
                    >
                      <div className="p-2">
                        <div
                          className="mb-1 h-1.5 w-10 rounded"
                          style={{ backgroundColor: t.preview[2], opacity: 0.5 }}
                        />
                        <div
                          className="h-1 w-8 rounded"
                          style={{ backgroundColor: t.preview[3], opacity: 0.2 }}
                        />
                      </div>
                    </div>
                    <div
                      className="h-14 rounded-lg"
                      style={{ backgroundColor: t.preview[1] }}
                    >
                      <div className="p-2">
                        <div
                          className="mb-1 h-1.5 w-6 rounded"
                          style={{ backgroundColor: t.preview[3], opacity: 0.4 }}
                        />
                        <div
                          className="h-1 w-10 rounded"
                          style={{ backgroundColor: t.preview[3], opacity: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active check */}
                  {isActive && (
                    <div
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: t.preview[2] }}
                    >
                      <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className={cn("p-4", theme.cardBg)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={cn("text-sm font-bold", theme.textPrimary)}>
                        {t.name}
                      </h3>
                      <p className={cn("mt-0.5 text-xs", theme.textMuted)}>
                        {t.description}
                      </p>
                    </div>
                  </div>
                  {/* Color swatches */}
                  <div className="mt-3 flex gap-1.5">
                    {t.preview.map((color, i) => (
                      <div
                        key={i}
                        className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Theme Info */}
      <section className={cn("rounded-2xl border p-5", theme.cardBorder, theme.cardBg)}>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {(APP_THEMES.find(t => t.id === themeId)?.preview || []).map((color, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-lg border border-black/10 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div>
            <h3 className={cn("font-semibold", theme.textPrimary)}>
              {APP_THEMES.find(t => t.id === themeId)?.name} Theme Active
            </h3>
            <p className={cn("text-sm", theme.textMuted)}>
              Theme is applied instantly across all pages
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============ AI SETTINGS PANEL ============

function AISettingsPanel() {
  const { aiSettings, setAISettings, theme } = useSettings();
  const [localSettings, setLocalSettings] = useState<AISettings>({ ...aiSettings });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modelFilter, setModelFilter] = useState<"all" | "free" | "pro">("all");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(
    localSettings.validated
      ? { valid: true, message: localSettings.validationMessage || "API key validated." }
      : null
  );

  const currentProvider = AI_PROVIDERS.find((p) => p.id === localSettings.providerId) || AI_PROVIDERS[0];
  const filteredModels = modelFilter === "all"
    ? currentProvider.models
    : currentProvider.models.filter((m) => m.tier === modelFilter);

  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId) || AI_PROVIDERS[0];
    const firstModel = provider.models[0];
    setLocalSettings({
      ...localSettings,
      providerId,
      baseUrl: provider.defaultBaseUrl,
      selectedModelId: firstModel?.id || "",
      apiKey: "",
      validated: false,
      validationMessage: "",
    });
    setValidationResult(null);
  };

  const handleApiKeyChange = (value: string) => {
    setLocalSettings({
      ...localSettings,
      apiKey: value,
      validated: false,
      validationMessage: "",
    });
    setValidationResult(null);
  };

  const handleValidate = async () => {
    if (!localSettings.apiKey) {
      setValidationResult({ valid: false, message: "Please enter an API key first." });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    const result = await validateAPIKey(
      localSettings.providerId,
      localSettings.apiKey,
      localSettings.baseUrl,
      localSettings.selectedModelId
    );

    setValidationResult(result);
    setLocalSettings({
      ...localSettings,
      validated: result.valid,
      validationMessage: result.message,
    });
    setValidating(false);
  };

  const handleSave = () => {
    if (!localSettings.validated) {
      setValidationResult({ valid: false, message: "Please validate your API key before saving." });
      return;
    }
    setAISettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Provider Selection */}
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>AI Provider</h2>
        <p className={cn("mb-4 text-sm", theme.textMuted)}>Choose your preferred AI service provider</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {AI_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                localSettings.providerId === provider.id
                  ? cn("shadow-md", theme.surfaceBg, theme.textPrimary, "border-current")
                  : cn(theme.cardBg, theme.cardBorder, theme.hoverBg)
              )}
            >
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm", theme.cardBg)}>
                {provider.icon}
              </span>
              <div>
                <h3 className={cn("font-semibold", theme.textPrimary)}>{provider.name}</h3>
                <p className={cn("text-xs", theme.textMuted)}>
                  {provider.models.length} models available
                </p>
              </div>
              {localSettings.providerId === provider.id && (
                <svg className={cn("ml-auto h-5 w-5", theme.textPrimary)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* API Key */}
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>
          API Key
        </h2>
        <p className={cn("mb-4 text-sm", theme.textMuted)}>
          Enter your {currentProvider.name} API key to connect
        </p>

        {currentProvider.id === "groq" ? (
          <>
            {/* Groq API Key */}
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={localSettings.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={currentProvider.apiKeyPlaceholder}
                className={cn(
                  "w-full rounded-xl border px-4 py-3.5 pr-24 font-mono text-sm outline-none transition focus:ring-2",
                  theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder,
                  validationResult?.valid === true
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : validationResult?.valid === false
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : cn(theme.inputFocusBorder, theme.inputFocusRing)
                )}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className={cn("absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium", theme.textMuted, theme.hoverBg)}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>

            {/* Groq Quick Setup Info */}
            <div className={cn("mt-5 rounded-xl border p-4", theme.surfaceBg, theme.surfaceBorder)}>
              <h4 className={cn("mb-2 text-sm font-semibold flex items-center gap-2", theme.textPrimary)}>
                <span className="text-lg">⚡</span> Groq — Lightning Fast Inference
              </h4>
              <div className={cn("space-y-2 text-xs", theme.textSecondary)}>
                <div className="flex items-start gap-2">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", theme.accent, theme.accentText)}>1</span>
                  <span>Go to <strong className={theme.textPrimary}>console.groq.com</strong> and create a free account</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", theme.accent, theme.accentText)}>2</span>
                  <span>Navigate to <strong className={theme.textPrimary}>API Keys</strong> and create a new key</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", theme.accent, theme.accentText)}>3</span>
                  <span>Copy the key (starts with <code className={cn("rounded px-1 py-0.5 font-mono", theme.badgeBg)}>gsk_</code>) and paste it above</span>
                </div>
              </div>
              <div className={cn("mt-3 flex items-center gap-2 rounded-lg border px-3 py-2", theme.surfaceBorder, "bg-emerald-500/5 border-emerald-500/20")}>
                <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span className="text-xs text-emerald-500">Groq offers the fastest LLM inference — up to 500+ tokens/second!</span>
              </div>
            </div>
          </>
        ) : (
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={localSettings.apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={currentProvider.apiKeyPlaceholder}
              className={cn(
                "w-full rounded-xl border px-4 py-3.5 pr-24 font-mono text-sm outline-none transition focus:ring-2",
                theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder,
                validationResult?.valid === true
                  ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : validationResult?.valid === false
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : cn(theme.inputFocusBorder, theme.inputFocusRing)
              )}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className={cn("absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium", theme.textMuted, theme.hoverBg)}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        )}

        {/* Validate Button */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleValidate}
            disabled={validating}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all border",
              validating
                ? cn(theme.badgeBg, theme.textMuted)
                : localSettings.validated
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : cn(theme.cardBg, theme.textPrimary, theme.cardBorder, theme.hoverBg)
            )}
          >
            {validating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" />
                </svg>
                Validating...
              </>
            ) : localSettings.validated ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Validated
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Validate API Key
              </>
            )}
          </button>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={cn(
            "mt-3 flex items-start gap-2 rounded-xl border px-4 py-3",
            validationResult.valid
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          )}>
            {validationResult.valid ? (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <p className={cn("text-sm", validationResult.valid ? "text-emerald-500" : "text-red-500")}>
              {validationResult.message}
            </p>
          </div>
        )}
      </section>

      {/* Base URL (only for providers with editable URLs) */}
      {currentProvider.baseUrlEditable && (
        <section>
          <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>Base URL</h2>
          <p className={cn("mb-4 text-sm", theme.textMuted)}>
            Configure the endpoint URL
          </p>
          <input
            type="text"
            value={localSettings.baseUrl}
            onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value, validated: false, validationMessage: "" })}
            placeholder={currentProvider.defaultBaseUrl}
            className={cn(
              "w-full rounded-xl border px-4 py-3.5 font-mono text-sm outline-none transition focus:ring-2",
              theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing
            )}
          />
        </section>
      )}

      {/* Model Selection */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className={cn("text-lg font-semibold", theme.textPrimary)}>Model</h2>
            <p className={cn("text-sm", theme.textMuted)}>Select a model from {currentProvider.name}</p>
          </div>
          <div className={cn("flex gap-1 rounded-lg p-1", theme.tabBg)}>
            {(["all", "free", "pro"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setModelFilter(filter)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                  modelFilter === filter
                    ? cn(theme.tabActiveBg, theme.tabActiveText, "shadow-sm")
                    : theme.tabInactiveText
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => setLocalSettings({ ...localSettings, selectedModelId: model.id })}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                localSettings.selectedModelId === model.id
                  ? cn("border-current shadow-sm", theme.surfaceBg, theme.textPrimary)
                  : cn(theme.cardBg, theme.cardBorder, theme.hoverBg)
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn("text-sm font-semibold", theme.textPrimary)}>{model.name}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      model.tier === "free"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-amber-500/15 text-amber-500"
                    )}
                  >
                    {model.tier}
                  </span>
                </div>
                <p className={cn("mt-0.5 text-xs", theme.textMuted)}>{model.description}</p>
                <p className={cn("mt-1 font-mono text-[10px]", theme.textMuted)}>{model.id}</p>
              </div>
              {localSettings.selectedModelId === model.id && (
                <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", theme.accent)}>
                  <svg className={cn("h-3.5 w-3.5", theme.accentText)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* System Prompt */}
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>System Prompt</h2>
        <p className={cn("mb-4 text-sm", theme.textMuted)}>
          Set the personality and behavior of your AI assistant
        </p>
        <textarea
          value={localSettings.systemPrompt}
          onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
          rows={4}
          placeholder="You are a helpful assistant..."
          className={cn(
            "w-full resize-none rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:ring-2",
            theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing
          )}
        />
      </section>

      {/* Save Button */}
      <div className={cn("flex items-center gap-4 border-t pt-6", theme.divider)}>
        <button
          onClick={handleSave}
          disabled={!localSettings.validated}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow-md transition-all",
            saved
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : !localSettings.validated
              ? cn(theme.badgeBg, theme.textMuted, "shadow-none cursor-not-allowed")
              : cn(theme.accent, theme.accentText, theme.accentHover)
          )}
        >
          {saved ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </>
          ) : (
            "Save AI Settings"
          )}
        </button>
        {!localSettings.validated && (
          <p className="text-xs text-amber-500">Validate your API key first to save settings</p>
        )}
        {localSettings.validated && (
          <p className={cn("text-xs", theme.textMuted)}>Settings are stored in your browser</p>
        )}
      </div>
    </div>
  );
}

// ============ GOOGLE DRIVE SETTINGS PANEL ============

function DriveSettingsPanel() {
  const { driveSettings, setDriveSettings, theme } = useSettings();
  const [localDrive, setLocalDrive] = useState({ ...driveSettings });
  const [showKey, setShowKey] = useState(false);
  const [showClientId, setShowClientId] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  const handleSave = () => {
    if (!localDrive.connected) {
      setTestMessage("Please test and validate the connection first.");
      setTestStatus("error");
      setTimeout(() => { setTestStatus("idle"); setTestMessage(""); }, 3000);
      return;
    }
    setDriveSettings(localDrive);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!localDrive.apiKey || !localDrive.clientId) {
      setTestStatus("error");
      setTestMessage("Please enter both API Key and Client ID before testing.");
      setTimeout(() => { setTestStatus("idle"); setTestMessage(""); }, 3000);
      return;
    }

    setTestStatus("testing");
    setTestMessage("");

    try {
      const url = `https://www.googleapis.com/drive/v3/about?fields=user&key=${localDrive.apiKey}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localDrive.clientId}` },
      });

      if (res.ok) {
        setTestStatus("success");
        setTestMessage("Connection successful! Google Drive is ready to use.");
        setLocalDrive({ ...localDrive, connected: true });
      } else if (res.status === 401 || res.status === 403) {
        setTestStatus("error");
        setTestMessage("Authentication failed. Please check your API Key and Client ID.");
        setLocalDrive({ ...localDrive, connected: false });
      } else {
        setTestStatus("error");
        setTestMessage(`Connection failed with status ${res.status}. Please verify your credentials.`);
        setLocalDrive({ ...localDrive, connected: false });
      }
    } catch {
      setTestStatus("error");
      setTestMessage("Network error. Please check your internet connection and credentials.");
      setLocalDrive({ ...localDrive, connected: false });
    }

    setTimeout(() => { setTestStatus("idle"); }, 5000);
  };

  const handleDisconnect = () => {
    setLocalDrive({ ...localDrive, connected: false, lastSynced: null });
    setDriveSettings({ ...localDrive, connected: false, lastSynced: null });
    setTestMessage("");
  };

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <section>
        <div className={cn("flex items-center justify-between rounded-2xl border p-5", theme.cardBorder, theme.cardBg)}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              localDrive.connected ? "bg-emerald-500/10" : theme.surfaceBg
            )}>
              <svg className={cn("h-7 w-7", localDrive.connected ? "text-emerald-500" : theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h3 className={cn("font-semibold", theme.textPrimary)}>Google Drive</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  localDrive.connected ? "bg-emerald-400" : theme.textMuted
                )} />
                <span className={cn(
                  "text-sm",
                  localDrive.connected ? "text-emerald-500" : theme.textMuted
                )}>
                  {localDrive.connected ? "Connected" : "Not connected"}
                </span>
              </div>
              {localDrive.lastSynced && (
                <p className={cn("text-xs mt-0.5", theme.textMuted)}>Last synced: {localDrive.lastSynced}</p>
              )}
            </div>
          </div>
          {localDrive.connected && (
            <button
              onClick={handleDisconnect}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/20"
            >
              Disconnect
            </button>
          )}
        </div>
      </section>

      {/* API Key */}
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>API Key</h2>
        <p className={cn("mb-4 text-sm", theme.textMuted)}>
          Enter your Google Cloud API key with Drive API enabled
        </p>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={localDrive.apiKey}
            onChange={(e) => setLocalDrive({ ...localDrive, apiKey: e.target.value, connected: false })}
            placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className={cn(
              "w-full rounded-xl border px-4 py-3.5 pr-24 font-mono text-sm outline-none transition focus:ring-2",
              theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing
            )}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className={cn("absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium", theme.textMuted, theme.hoverBg)}
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
      </section>

      {/* Client ID */}
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>Client ID / Access Token</h2>
        <p className={cn("mb-4 text-sm", theme.textMuted)}>
          Your OAuth 2.0 Access Token from Google Cloud Console
        </p>
        <div className="relative">
          <input
            type={showClientId ? "text" : "password"}
            value={localDrive.clientId}
            onChange={(e) => setLocalDrive({ ...localDrive, clientId: e.target.value, connected: false })}
            placeholder="ya29.xxxxxxxxxxxxxxxxxxxxxxxx"
            className={cn(
              "w-full rounded-xl border px-4 py-3.5 pr-24 font-mono text-sm outline-none transition focus:ring-2",
              theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing
            )}
          />
          <button
            onClick={() => setShowClientId(!showClientId)}
            className={cn("absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium", theme.textMuted, theme.hoverBg)}
          >
            {showClientId ? "Hide" : "Show"}
          </button>
        </div>
      </section>

      {/* Folder ID */}
      <section>
        <h2 className={cn("mb-1 text-lg font-semibold", theme.textPrimary)}>Drive Folder ID</h2>
        <p className={cn("mb-4 text-sm", theme.textMuted)}>
          Optional. Specify a folder ID to store notes in. Leave empty to use root.
        </p>
        <input
          type="text"
          value={localDrive.folderId}
          onChange={(e) => setLocalDrive({ ...localDrive, folderId: e.target.value })}
          placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2wtIs"
          className={cn(
            "w-full rounded-xl border px-4 py-3.5 font-mono text-sm outline-none transition focus:ring-2",
            theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder, theme.inputFocusBorder, theme.inputFocusRing
          )}
        />
      </section>

      {/* Auto Sync */}
      <section>
        <div className={cn("flex items-center justify-between rounded-2xl border p-5", theme.cardBorder, theme.cardBg)}>
          <div>
            <h3 className={cn("font-semibold", theme.textPrimary)}>Auto-Sync</h3>
            <p className={cn("text-sm mt-0.5", theme.textMuted)}>
              Automatically save and load notes when changes are made
            </p>
          </div>
          <button
            onClick={() => setLocalDrive({ ...localDrive, autoSync: !localDrive.autoSync })}
            className={cn(
              "relative h-7 w-12 rounded-full transition-all duration-300",
              localDrive.autoSync ? "bg-emerald-500" : theme.badgeBg
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-300",
                localDrive.autoSync ? "left-5.5" : "left-0.5"
              )}
            />
          </button>
        </div>
      </section>

      {/* Test Result */}
      {testMessage && (
        <div className={cn(
          "flex items-start gap-2 rounded-xl border px-4 py-3",
          testStatus === "success" || localDrive.connected
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10"
        )}>
          {testStatus === "success" || localDrive.connected ? (
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <p className={cn("text-sm", testStatus === "success" || localDrive.connected ? "text-emerald-500" : "text-red-500")}>
            {testMessage}
          </p>
        </div>
      )}

      {/* Setup Guide */}
      <section>
        <h2 className={cn("mb-3 text-lg font-semibold", theme.textPrimary)}>Setup Guide</h2>
        <div className={cn("rounded-2xl border p-5", theme.surfaceBorder, theme.surfaceBg)}>
          <ol className={cn("space-y-3 text-sm", theme.textSecondary)}>
            <li className="flex gap-3">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.accent, theme.accentText)}>1</span>
              <span>Go to the <strong className={theme.textPrimary}>Google Cloud Console</strong> and create a new project or select an existing one.</span>
            </li>
            <li className="flex gap-3">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.accent, theme.accentText)}>2</span>
              <span>Enable the <strong className={theme.textPrimary}>Google Drive API</strong> from the API Library.</span>
            </li>
            <li className="flex gap-3">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.accent, theme.accentText)}>3</span>
              <span>Create an <strong className={theme.textPrimary}>API Key</strong> under Credentials and restrict it to the Drive API.</span>
            </li>
            <li className="flex gap-3">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.accent, theme.accentText)}>4</span>
              <span>Create an <strong className={theme.textPrimary}>OAuth 2.0 Client ID</strong> for a web application and add your domain as an authorized origin.</span>
            </li>
            <li className="flex gap-3">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.accent, theme.accentText)}>5</span>
              <span>Paste both keys above, then click <strong className={theme.textPrimary}>Test Connection</strong> to verify.</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Actions */}
      <div className={cn("flex flex-wrap items-center gap-4 border-t pt-6", theme.divider)}>
        <button
          onClick={handleSave}
          disabled={!localDrive.connected}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow-md transition-all",
            saved
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : !localDrive.connected
              ? cn(theme.badgeBg, theme.textMuted, "shadow-none cursor-not-allowed")
              : cn(theme.accent, theme.accentText, theme.accentHover)
          )}
        >
          {saved ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </>
          ) : (
            "Save Drive Settings"
          )}
        </button>

        <button
          onClick={handleTestConnection}
          disabled={testStatus === "testing"}
          className={cn(
            "flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-medium transition-all",
            testStatus === "testing"
              ? cn(theme.cardBorder, theme.surfaceBg, theme.textMuted)
              : testStatus === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : testStatus === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-500"
              : cn(theme.cardBorder, theme.cardBg, theme.textPrimary, theme.hoverBg)
          )}
        >
          {testStatus === "testing" && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" />
            </svg>
          )}
          {testStatus === "success" && (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {testStatus === "error" && (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {testStatus === "testing"
            ? "Testing..."
            : testStatus === "success"
            ? "Connected!"
            : testStatus === "error"
            ? "Failed"
            : "Test Connection"}
        </button>

        {!localDrive.connected && (
          <p className="text-xs text-amber-500">Validate connection first to save settings</p>
        )}
        {localDrive.connected && (
          <p className={cn("text-xs", theme.textMuted)}>Settings are stored in your browser</p>
        )}
      </div>
    </div>
  );
}
