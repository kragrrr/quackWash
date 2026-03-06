import { useState, useEffect } from "react";
import { Machine } from "@/data/mockData";
import TopBar from "@/components/TopBar";
import StatusStrip from "@/components/StatusStrip";
import PondScene from "@/components/PondScene";
import PixelDuck from "@/components/PixelDuck";
import DuckDrawer from "@/components/DuckDrawer";
import { useMachines } from "@/hooks/useMachines";
import { useNotifications } from "@/hooks/useNotifications";

const Index = () => {
  const { data: machines = [], isLoading } = useMachines();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    watchMachine,
    unwatchMachine,
    isWatched,
    watchedCount,
  } = useNotifications(machines);

  useEffect(() => {
    if (selectedMachine && machines.length > 0) {
      const updated = machines.find((m) => m.id === selectedMachine.id);
      if (updated) setSelectedMachine(updated);
    }
  }, [machines, selectedMachine]);

  const handleDuckTap = (machine: Machine) => {
    setSelectedMachine(machine);
    setDrawerOpen(true);
  };

  if (isLoading && machines.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar notifications={watchedCount} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <span className="text-5xl animate-duck-bob inline-block">🦆</span>
            <p
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "0.55rem",
                color: "hsl(var(--muted-foreground))",
                letterSpacing: "0.06em",
              }}
            >
              LOADING<span className="animate-pixel-blink">_</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar notifications={watchedCount} />
      <StatusStrip machines={machines} />

      <main className="flex-1 px-2 sm:px-4 pb-4 flex flex-col gap-2 sm:gap-4">
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-1">
          <div className="flex items-center gap-1.5">
            <PixelDuck className="text-xl" style={{ filter: "hue-rotate(170deg) saturate(2.8) brightness(1.1) drop-shadow(0 2px 0 rgba(0,0,0,0.25))" }} />
            <span style={{ fontFamily: "VT323, monospace", fontSize: "0.85rem", color: "hsl(210 45% 36%)" }}>= Washer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PixelDuck className="text-xl" style={{ filter: "hue-rotate(330deg) saturate(3) brightness(1.1) drop-shadow(0 2px 0 rgba(0,0,0,0.25))" }} />
            <span style={{ fontFamily: "VT323, monospace", fontSize: "0.85rem", color: "hsl(28 45% 38%)" }}>= Dryer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "VT323, monospace", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>idle = floating • in-use = swimming</span>
          </div>
        </div>

        {/* Pond */}
        <div className="flex justify-center items-start flex-1 w-full pb-2">
          <div className="w-full max-w-md sm:max-w-lg px-2 sm:px-4">
            <PondScene
              machines={machines}
              onDuckClick={handleDuckTap}
              isWatched={isWatched}
            />
          </div>
        </div>
      </main>

      {/* Duck Drawer */}
      <DuckDrawer
        machine={selectedMachine}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isWatched={selectedMachine ? isWatched(selectedMachine.id) : false}
        onWatch={watchMachine}
        onUnwatch={unwatchMachine}
      />
    </div>
  );
};

export default Index;
