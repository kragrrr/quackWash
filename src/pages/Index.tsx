import { useState, useEffect } from "react";
import { Machine } from "@/data/mockData";
import TopBar from "@/components/TopBar";
import StatusStrip from "@/components/StatusStrip";
import PondScene from "@/components/PondScene";
import PixelDuck from "@/components/PixelDuck";
import DuckDrawer from "@/components/DuckDrawer";
import BreadcrumbEconomy from "@/components/BreadcrumbEconomy";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMachines } from "@/hooks/useMachines";
import { useNotifications } from "@/hooks/useNotifications";
import { useBreadcrumbs } from "@/contexts/BreadcrumbContext";

const Index = () => {
  const { data: machines = [], isLoading } = useMachines();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  const {
    watchedIds,
    emptyPondEnabled,
    watchMachine,
    unwatchMachine,
    toggleEmptyPond,
    isWatched,
    watchedCount,
  } = useNotifications(machines);

  const { recordCompletion, claimBreadcrumbs, canClaim, activeCosmeticEmoji } =
    useBreadcrumbs();

  const prevMachinesRef = useState<Map<string, Machine>>(() => new Map())[0];

  useEffect(() => {
    for (const machine of machines) {
      const prev = prevMachinesRef.get(machine.id);
      if (
        prev &&
        prev.status === "Running" &&
        machine.status === "Idle" &&
        watchedIds.has(machine.id)
      ) {
        recordCompletion(machine.id);
      }
    }
    prevMachinesRef.clear();
    for (const m of machines) {
      prevMachinesRef.set(m.id, m);
    }
  }, [machines, watchedIds, recordCompletion, prevMachinesRef]);

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

  const handleEmptyPondToggle = (checked: boolean) => {
    toggleEmptyPond(checked);
    toast({
      title: checked ? "🔔 Empty Pond Alert ON" : "🔕 Empty Pond Alert OFF",
      description: checked
        ? "We'll quack when any duck becomes free!"
        : "You won't be notified when machines are free.",
    });
  };

  const handleClaim = (machineId: string) => {
    claimBreadcrumbs(machineId);
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

      <main className="flex-1 px-4 pb-4 flex flex-col gap-4">
        {/* Legend */}
        <div className="flex justify-center gap-6 pt-1">
          <div className="flex items-center gap-1.5">
            <PixelDuck className="text-xl duck-washer" style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.25))" }} />
            <span style={{ fontFamily: "VT323, monospace", fontSize: "1rem", color: "hsl(210 45% 36%)" }}>= Washer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PixelDuck className="text-xl duck-dryer" style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.25))" }} />
            <span style={{ fontFamily: "VT323, monospace", fontSize: "1rem", color: "hsl(28 45% 38%)" }}>= Dryer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "VT323, monospace", fontSize: "1rem", color: "hsl(var(--muted-foreground))" }}>idle = floating • in-use = swimming</span>
          </div>
        </div>

        {/* Single Unified Pond */}
        <div className="flex justify-center items-center flex-1 w-full pb-4">
          <div className="w-full max-w-5xl px-2 sm:px-8">
            <PondScene
              machines={machines}
              onDuckClick={handleDuckTap}
              cosmeticEmoji={activeCosmeticEmoji}
              isWatched={isWatched}
            />
          </div>
        </div>

        {/* Alert toggle */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: "hsl(var(--card))",
            border: "2px solid hsl(var(--border))",
            boxShadow: "3px 3px 0px hsl(var(--px-shadow, 210 28% 45%) / 0.7)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-base">🔔</span>
            <span
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "0.45rem",
                color: "hsl(var(--card-foreground))",
                letterSpacing: "0.03em",
              }}
            >
              ALERT WHEN FREE
            </span>
          </div>
          <Switch checked={emptyPondEnabled} onCheckedChange={handleEmptyPondToggle} />
        </div>
      </main>

      {/* Breadcrumb Economy */}
      <BreadcrumbEconomy />

      {/* Duck Drawer */}
      <DuckDrawer
        machine={selectedMachine}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isWatched={selectedMachine ? isWatched(selectedMachine.id) : false}
        onWatch={watchMachine}
        onUnwatch={unwatchMachine}
        canClaim={selectedMachine ? canClaim(selectedMachine.id) : false}
        onClaim={handleClaim}
      />
    </div>
  );
};

export default Index;
