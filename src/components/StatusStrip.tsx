import { Machine } from "@/data/mockData";

interface StatusStripProps {
  machines: Machine[];
}

const StatusStrip = ({ machines }: StatusStripProps) => {
  const available = machines.filter((m) => m.status === "Idle").length;
  const running = machines.filter((m) => m.status === "Running").length;
  const down = machines.filter((m) => m.status === "Maintenance").length;

  return (
    <div className="flex justify-center gap-2 px-4 py-3">
      <div className="bg-duck-idle/15 border border-duck-idle/30 text-duck-idle rounded-full px-3 py-1 text-xs font-display font-bold">
        {available} Available
      </div>
      <div className="bg-duck-running/15 border border-duck-running/30 text-duck-running rounded-full px-3 py-1 text-xs font-display font-bold">
        {running} Running
      </div>
      <div className="bg-duck-maintenance/15 border border-duck-maintenance/30 text-duck-maintenance rounded-full px-3 py-1 text-xs font-display font-bold">
        {down} Down
      </div>
    </div>
  );
};

export default StatusStrip;
