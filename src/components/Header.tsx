import { cn } from "@/utils/cn";
import { useSettings } from "@/context/SettingsContext";

type Page = "notes" | "settings";

interface HeaderProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
}

export function Header({ activePage, onPageChange }: HeaderProps) {
  const { theme } = useSettings();

  return (
    <header className={cn("sticky top-0 z-40 border-b backdrop-blur-md", theme.headerBg, theme.headerBorder)}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", theme.accentGradientFrom, theme.accentGradientTo)}>
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className={cn("text-lg font-semibold tracking-tight", theme.textPrimary)}>
            Workspace
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className={cn("flex items-center gap-1 rounded-xl p-1", theme.tabBg)}>
          <button
            onClick={() => onPageChange("notes")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              activePage === "notes"
                ? cn(theme.tabActiveBg, theme.tabActiveText, "shadow-sm")
                : cn(theme.tabInactiveText, theme.hoverBg)
            )}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            Notes
          </button>
          <button
            onClick={() => onPageChange("settings")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              activePage === "settings"
                ? cn(theme.tabActiveBg, theme.tabActiveText, "shadow-sm")
                : cn(theme.tabInactiveText, theme.hoverBg)
            )}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            Settings
          </button>
        </nav>

        {/* Avatar */}
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold shadow-sm", theme.accentGradientFrom, theme.accentGradientTo, theme.accentText)}>
          U
        </div>
      </div>
    </header>
  );
}
