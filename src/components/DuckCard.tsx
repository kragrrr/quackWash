import { Machine } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface DuckCardProps {
  machine: Machine;
  index: number;
  onClick: () => void;
  cosmeticEmoji?: string | null;
  isWatched?: boolean;
}

const DuckCard = ({ machine, index, onClick, cosmeticEmoji, isWatched }: DuckCardProps) => {
  const isIdle = machine.status === "Idle";
  const isRunning = machine.status === "Running";
  const isMaintenance = machine.status === "Maintenance";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 transition-all duration-100 cursor-pointer select-none",
        "opacity-0 animate-fade-in-up",
        isIdle && "pixel-border-idle hover:scale-105",
        isRunning && "pixel-border-running animate-pixel-march hover:scale-105",
        isMaintenance && "pixel-border-maintenance opacity-75 hover:scale-105"
      )}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "forwards",
        background: isIdle
          ? "hsl(var(--duck-idle) / 0.08)"
          : isRunning
            ? "hsl(var(--duck-running) / 0.10)"
            : "hsl(var(--duck-maintenance) / 0.08)",
        imageRendering: "pixelated",
      }}
      aria-label={`${machine.name} - ${machine.status}`}
    >
      {/* Pixel march border for running (handled by CSS animation) */}

      {/* Caution stripes for maintenance */}
      {isMaintenance && (
        <div className="absolute top-0 left-0 right-0 h-2 caution-tape pointer-events-none" />
      )}

      {/* The Duck */}
      <span
        className={cn(
          "text-4xl sm:text-5xl leading-none select-none",
          isIdle && "animate-duck-bob",
          isRunning && "animate-duck-spin",
          isMaintenance && "animate-duck-wobble grayscale"
        )}
        role="img"
        aria-hidden="true"
      >
        🦆
      </span>

      {/* Cosmetic overlay — only visible when not in maintenance */}
      {cosmeticEmoji && !isMaintenance && (
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: "2px",
            fontSize: "12px",
            lineHeight: 1,
            pointerEvents: "none",
            imageRendering: "pixelated",
          }}
          aria-hidden="true"
        >
          {cosmeticEmoji}
        </span>
      )}

      {/* Watch indicator */}
      {isWatched && isRunning && (
        <span
          style={{
            position: "absolute",
            top: "-6px",
            left: "-6px",
            fontSize: "11px",
            lineHeight: 1,
            pointerEvents: "none",
          }}
          aria-label="Watching"
        >
          👁️
        </span>
      )}

      {/* Timer badge for running */}
      {isRunning && machine.cycleMinutesRemaining != null && (
        <span
          className="absolute -top-2 -right-2 text-secondary-foreground font-display text-center leading-none px-1 py-0.5"
          style={{
            background: "hsl(var(--secondary))",
            border: "2px solid hsl(var(--secondary-foreground) / 0.3)",
            boxShadow: "2px 2px 0px hsl(var(--px-shadow) / 0.7)",
            fontSize: "0.4rem",
            minWidth: "28px",
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          {machine.cycleMinutesRemaining}m
        </span>
      )}

      {/* Label */}
      <span
        className="leading-tight text-center"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "0.38rem",
          letterSpacing: "0.01em",
          color: isIdle
            ? "hsl(var(--duck-idle))"
            : isRunning
              ? "hsl(var(--duck-running))"
              : "hsl(var(--duck-maintenance))",
        }}
      >
        {isIdle && "FREE"}
        {isRunning && "RUN"}
        {isMaintenance && "DOWN"}
      </span>

      {/* Machine name */}
      <span
        className="text-muted-foreground leading-tight text-center"
        style={{ fontFamily: "VT323, monospace", fontSize: "0.75rem" }}
      >
        {machine.name}
      </span>
    </button>
  );
};

export default DuckCard;
