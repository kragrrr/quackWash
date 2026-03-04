import { useState } from "react";
import { MOCK_MACHINES, MOCK_BREADCRUMBS, MOCK_NOTIFICATIONS, Machine } from "@/data/mockData";
import TopBar from "@/components/TopBar";
import StatusStrip from "@/components/StatusStrip";
import DuckCard from "@/components/DuckCard";
import DuckDrawer from "@/components/DuckDrawer";
import BreadcrumbEconomy from "@/components/BreadcrumbEconomy";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [machines] = useState<Machine[]>(MOCK_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [emptyPondAlert, setEmptyPondAlert] = useState(false);
  const { toast } = useToast();

  const washers = machines.filter((m) => m.type === "Washer");
  const dryers = machines.filter((m) => m.type === "Dryer");

  const handleDuckTap = (machine: Machine) => {
    setSelectedMachine(machine);
    setDrawerOpen(true);
  };

  const handleEmptyPondToggle = (checked: boolean) => {
    setEmptyPondAlert(checked);
    toast({
      title: checked ? "🔔 Empty Pond Alert ON" : "🔕 Empty Pond Alert OFF",
      description: checked
        ? "We'll quack when any duck becomes free!"
        : "You won't be notified when machines are free.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar breadcrumbs={MOCK_BREADCRUMBS} notifications={MOCK_NOTIFICATIONS} />
      <StatusStrip machines={machines} />

      {/* The Pond */}
      <main className="flex-1 px-4 pb-4">
        <div className="pond-bg rounded-3xl p-4 sm:p-6 space-y-6">
          {/* Washers Section */}
          <section>
            <h2 className="font-display font-bold text-sm text-secondary-foreground/80 mb-3 flex items-center gap-2">
              <span>🫧</span> Washers
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 justify-items-center">
              {washers.map((machine, i) => (
                <DuckCard
                  key={machine.id}
                  machine={machine}
                  index={i}
                  onClick={() => handleDuckTap(machine)}
                />
              ))}
            </div>
          </section>

          {/* Dryers Section */}
          <section>
            <h2 className="font-display font-bold text-sm text-secondary-foreground/80 mb-3 flex items-center gap-2">
              <span>🔥</span> Dryers
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 justify-items-center">
              {dryers.map((machine, i) => (
                <DuckCard
                  key={machine.id}
                  machine={machine}
                  index={i + washers.length}
                  onClick={() => handleDuckTap(machine)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Empty Pond Alert */}
        <div className="mt-4 bg-card rounded-2xl border border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <span className="font-display font-bold text-sm text-card-foreground">
              Alert when any duck is free
            </span>
          </div>
          <Switch checked={emptyPondAlert} onCheckedChange={handleEmptyPondToggle} />
        </div>
      </main>

      {/* Breadcrumb Economy */}
      <BreadcrumbEconomy breadcrumbs={MOCK_BREADCRUMBS} />

      {/* Duck Drawer */}
      <DuckDrawer
        machine={selectedMachine}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Index;
