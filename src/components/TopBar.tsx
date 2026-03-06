import { Badge } from "@/components/ui/badge";
import { Menu } from "lucide-react";

interface TopBarProps {
  notifications: number;
}

const TopBar = ({ notifications }: TopBarProps) => {
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
        <span className="text-3xl" style={{ imageRendering: "pixelated" }}>🦆</span>
        <div className="flex flex-col">
          <h1
            className="font-display text-primary-foreground tracking-tight leading-none text-sm sm:text-lg md:text-xl"
          >
            I-House Dashboard
          </h1>
          <span className="text-[10px] sm:text-xs text-primary-foreground/80 mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            Made with ❤️ by I-House students.
          </span>
        </div>
      </div>

    </header>
  );
};

export default TopBar;
