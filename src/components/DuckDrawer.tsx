import { Machine } from "@/data/mockData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DuckDrawerProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DuckDrawer = ({ machine, open, onOpenChange }: DuckDrawerProps) => {
  const { toast } = useToast();

  if (!machine) return null;

  const isIdle = machine.status === "Idle";
  const isRunning = machine.status === "Running";
  const isMaintenance = machine.status === "Maintenance";

  const handleWatch = () => {
    toast({
      title: "🔔 Watching this duck!",
      description: `We'll quack at you when ${machine.name} is done.`,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t-4 border-primary">
        <DrawerHeader className="text-center">
          <div className="text-5xl mb-2">
            {isIdle && "🦆"}
            {isRunning && "🌀"}
            {isMaintenance && "💀"}
          </div>
          <DrawerTitle className="font-display text-xl">
            {machine.name}
          </DrawerTitle>
          <DrawerDescription className="font-body">
            {machine.type} •{" "}
            <span
              className={
                isIdle
                  ? "text-duck-idle font-bold"
                  : isRunning
                  ? "text-duck-running font-bold"
                  : "text-duck-maintenance font-bold"
              }
            >
              {machine.status}
            </span>
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-2 text-center">
          {isIdle && (
            <p className="text-lg font-display text-duck-idle">
              🎉 This duck is free!
            </p>
          )}
          {isRunning && (
            <div className="space-y-3">
              <div className="bg-muted rounded-xl p-4 inline-block">
                <p className="text-3xl font-display font-bold text-duck-running">
                  {machine.cycleMinutesRemaining}
                  <span className="text-lg ml-1">min left</span>
                </p>
              </div>
            </div>
          )}
          {isMaintenance && (
            <p className="text-lg font-display text-duck-maintenance">
              💀 This duck is broken
            </p>
          )}
        </div>

        <DrawerFooter>
          {isRunning && (
            <Button
              onClick={handleWatch}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-display text-base gap-2"
            >
              <Bell className="w-4 h-4" />
              Watch this Duck 🔔
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline" className="font-display">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DuckDrawer;
