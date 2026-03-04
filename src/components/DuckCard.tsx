import { Machine } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface DuckCardProps {
  machine: Machine;
  index: number;
  onClick: () => void;
}

const DuckCard = ({ machine, index, onClick }: DuckCardProps) => {
  const isIdle = machine.status === "Idle";
  const isRunning = machine.status === "Running";
  const isMaintenance = machine.status === "Maintenance";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 cursor-pointer select-none",
        "opacity-0 animate-fade-in-up",
        isIdle && "duck-glow-idle hover:scale-110",
        isRunning && "duck-glow-running border-2 border-duck-running animate-pulse-border hover:scale-105",
        isMaintenance && "duck-glow-maintenance opacity-70 hover:scale-105"
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
      aria-label={`${machine.name} - ${machine.status}`}
    >
      {/* Whirlpool effect for running */}
      {isRunning && (
        <div className="absolute inset-0 rounded-2xl whirlpool animate-whirlpool-spin pointer-events-none" />
      )}

      {/* Ripple for running */}
      {isRunning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border-2 border-duck-running/40 animate-ripple" />
        </div>
      )}

      {/* Caution tape for maintenance */}
      {isMaintenance && (
        <div className="absolute top-1 left-1 right-1 h-3 caution-tape rounded-full opacity-80" />
      )}

      {/* The Duck */}
      <span
        className={cn(
          "text-4xl sm:text-5xl leading-none select-none",
          isIdle && "animate-duck-bob",
          isRunning && "animate-duck-spin",
          isMaintenance && "animate-duck-wobble grayscale-[30%]"
        )}
        role="img"
        aria-hidden="true"
      >
        🦆
      </span>

      {/* Timer overlay for running */}
      {isRunning && machine.cycleMinutesRemaining != null && (
        <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] font-bold font-display px-1.5 py-0.5 rounded-full min-w-[28px] text-center">
          {machine.cycleMinutesRemaining}m
        </span>
      )}

      {/* Label */}
      <span
        className={cn(
          "text-[10px] sm:text-xs font-bold font-display leading-tight text-center",
          isIdle && "text-duck-idle",
          isRunning && "text-duck-running",
          isMaintenance && "text-duck-maintenance"
        )}
      >
        {isIdle && "Available"}
        {isRunning && "Running"}
        {isMaintenance && "Out of Order"}
      </span>

      {/* Machine name */}
      <span className="text-[9px] text-muted-foreground font-body leading-tight">
        {machine.name}
      </span>
    </button>
  );
};

export default DuckCard;
