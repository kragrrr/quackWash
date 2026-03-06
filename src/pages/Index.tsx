import { useState, useEffect } from "react";
import { Machine } from "@/data/mockData";
import TopBar from "@/components/TopBar";
import DuckDrawer from "@/components/DuckDrawer";
import PondDrawer from "@/components/PondDrawer";
import DashboardAccordion from "@/components/DashboardAccordion";
import { useMachines } from "@/hooks/useMachines";

import { useTransport } from "@/hooks/useTransport";

const Index = () => {
  const { data: machines = [], isLoading: isLoadingMachines, refetch: refetchMachines } = useMachines();
  const { data: shuttles = [], isLoading: isLoadingShuttles, refetch: refetchShuttles } = useTransport();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [duckDrawerOpen, setDuckDrawerOpen] = useState(false);
  const [pondDrawerOpen, setPondDrawerOpen] = useState(false);



  useEffect(() => {
    if (selectedMachine && machines.length > 0) {
      const updated = machines.find((m) => m.id === selectedMachine.id);
      if (updated) setSelectedMachine(updated);
    }
  }, [machines, selectedMachine]);

  const handleDuckTap = (machine: Machine) => {
    setSelectedMachine(machine);
    setDuckDrawerOpen(true);
  };

  if (isLoadingMachines && machines.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar notifications={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <span className="text-5xl animate-duck-bob inline-block">🦆</span>
            <p
              className="text-[0.65rem] sm:text-sm"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                color: "hsl(var(--muted-foreground))",
                letterSpacing: "0.06em",
              }}
            >
              LOADING<span className="animate-pixel-blink">_</span>
            </p>
          </div>
        </div>
      </div >
    );
  }

  return (
    <div className="min-h-screen bg-[url('/bg-clouds.png')] bg-cover bg-fixed bg-center flex flex-col pt-1" style={{ backgroundColor: "#e0f2fe" }}>
      <TopBar notifications={0} />

      <main className="flex-1 pb-20 overflow-y-auto w-full max-w-lg mx-auto hide-scrollbar">
        <DashboardAccordion
          machines={machines}
          onShowMachineDetails={() => setPondDrawerOpen(true)}
        />
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 w-full max-w-lg mx-auto sm:left-1/2 sm:-translate-x-1/2 p-4 pb-6 flex items-center justify-center text-center"
        style={{
          background: "linear-gradient(to right, #1a2f3e, #2b3a4a)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          boxShadow: "0 -4px 10px rgba(0,0,0,0.2)"
        }}>
        <p className="text-xs text-white/50" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', lineHeight: '1.5' }}>
          This page is not affiliated with UOW or I-House.
        </p>
      </div>

      {/* Drawer for individual machine options (watch/unwatch) */}
      <DuckDrawer
        machine={selectedMachine}
        open={duckDrawerOpen}
        onOpenChange={setDuckDrawerOpen}
      />

      {/* Drawer showing the full Pond Scene */}
      <PondDrawer
        machines={machines}
        open={pondDrawerOpen}
        onOpenChange={setPondDrawerOpen}
        onDuckClick={handleDuckTap}
      />
    </div>
  );
};

export default Index;
