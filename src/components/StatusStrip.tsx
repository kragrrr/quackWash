import { Machine } from "@/data/mockData";

interface StatusStripProps {
  machines: Machine[];
}

const StatusStrip = ({ machines }: StatusStripProps) => {
  const available = machines.filter((m) => m.status === "Idle").length;
  const running = machines.filter((m) => m.status === "Running").length;
  const down = machines.filter((m) => m.status === "Maintenance").length;

  const chipStyle = (color: string): React.CSSProperties => ({
    border: `2px solid ${color}`,
    boxShadow: `2px 2px 0px ${color}80`,
    padding: "4px 10px",
    fontFamily: '"Press Start 2P", monospace',
    fontSize: "0.45rem",
    letterSpacing: "0.02em",
    lineHeight: 1.6,
    background: `${color}18`,
    color,
  });

  return (
    <div className="flex justify-center gap-3 px-4 py-3">
      <div style={chipStyle("hsl(var(--duck-idle))")}>
        ▶ {available} AVAIL
      </div>
      <div style={chipStyle("hsl(var(--duck-running))")}>
        ◉ {running} RUN
      </div>
      <div style={chipStyle("hsl(var(--duck-maintenance))")}>
        ✖ {down} DOWN
      </div>
    </div>
  );
};

export default StatusStrip;
