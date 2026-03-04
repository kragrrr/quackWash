import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useBreadcrumbs } from "@/contexts/BreadcrumbContext";

interface TopBarProps {
  notifications: number;
}

const TopBar = ({ notifications }: TopBarProps) => {
  const { breadcrumbs } = useBreadcrumbs();

  return (
    <header
      className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
      style={{
        background: "hsl(var(--primary))",
        borderBottom: "4px solid hsl(var(--px-shadow, 210 28% 42%))",
        boxShadow: "0px 4px 0px hsl(var(--px-shadow, 210 28% 42%) / 0.6)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl" style={{ imageRendering: "pixelated" }}>🦆</span>
        <h1
          className="font-display text-primary-foreground tracking-tight leading-none"
          style={{ fontSize: "0.65rem" }}
        >
          QuackWash
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Breadcrumb balance — pixel chip */}
        <div
          className="pixel-border flex items-center gap-1.5 px-2 py-1"
          style={{
            background: "hsl(var(--primary-foreground) / 0.12)",
            border: "2px solid hsl(var(--primary-foreground) / 0.5)",
            boxShadow: "2px 2px 0px hsl(var(--px-shadow, 210 28% 35%) / 0.8)",
          }}
        >
          <span className="text-sm">🍞</span>
          <span
            className="font-display text-primary-foreground leading-none"
            style={{ fontSize: "0.55rem" }}
          >
            {breadcrumbs}
          </span>
        </div>

        {/* Notification bell */}
        <button
          className="relative p-1"
          aria-label="Notifications"
          style={{
            border: "2px solid hsl(var(--primary-foreground) / 0.5)",
            boxShadow: "2px 2px 0px hsl(var(--px-shadow, 210 28% 35%) / 0.8)",
          }}
        >
          <Bell className="w-4 h-4 text-primary-foreground" />
          {notifications > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[9px] border-0 flex items-center justify-center"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
                borderRadius: "0px",
                fontFamily: '"Press Start 2P", monospace',
              }}
            >
              {notifications}
            </Badge>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
