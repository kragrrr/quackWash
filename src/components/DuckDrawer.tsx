import { Machine } from "@/data/mockData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DuckDrawerProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWatched?: boolean;
  onWatch?: (machineId: string) => void;
  onUnwatch?: (machineId: string) => void;
  canClaim?: boolean;
  onClaim?: (machineId: string) => void;
}

const pixelBtnBase: React.CSSProperties = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: "0.55rem",
  letterSpacing: "0.04em",
  borderRadius: "0px",
  border: "2px solid hsl(var(--border))",
  boxShadow: "3px 3px 0px hsl(var(--px-shadow, 210 28% 45%) / 0.85)",
  transition: "box-shadow 0.06s, transform 0.06s",
  lineHeight: 1.8,
};

const DuckDrawer = ({
  machine,
  open,
  onOpenChange,
  isWatched = false,
  onWatch,
  onUnwatch,
  canClaim = false,
  onClaim,
}: DuckDrawerProps) => {
  const { toast } = useToast();

  if (!machine) return null;

  const isIdle = machine.status === "Idle";
  const isRunning = machine.status === "Running";
  const isMaintenance = machine.status === "Maintenance";

  const handleWatch = () => {
    if (isWatched && onUnwatch) {
      onUnwatch(machine.id);
      toast({
        title: "🔕 Unwatched this duck",
        description: `You'll no longer be notified about ${machine.name}.`,
      });
    } else if (onWatch) {
      onWatch(machine.id);
      toast({
        title: "🔔 Watching this duck!",
        description: `We'll quack at you when ${machine.name} is done.`,
      });
    }
    onOpenChange(false);
  };

  const handleClaim = () => {
    if (onClaim) {
      onClaim(machine.id);
      toast({
        title: "🍞 +10 Breadcrumbs!",
        description: `Great job clearing ${machine.name} quickly!`,
      });
    }
    onOpenChange(false);
  };

  const statusColor = isIdle
    ? "hsl(var(--duck-idle))"
    : isRunning
      ? "hsl(var(--duck-running))"
      : "hsl(var(--duck-maintenance))";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        style={{
          background: "hsl(var(--card))",
          borderTop: `4px solid ${statusColor}`,
          borderRadius: "0px",
          boxShadow: `0px -4px 0px ${statusColor}60`,
        }}
      >
        <DrawerHeader className="text-center">
          {/* Big icon with pixel border */}
          <div
            className="inline-flex mx-auto mb-3 items-center justify-center"
            style={{
              fontSize: "3rem",
              border: `3px solid ${statusColor}`,
              boxShadow: `4px 4px 0px ${statusColor}60`,
              padding: "8px 14px",
              background: `${statusColor}0F`,
            }}
          >
            {isIdle && "🦆"}
            {isRunning && "🌀"}
            {isMaintenance && "💀"}
          </div>

          <DrawerTitle
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "0.65rem",
              letterSpacing: "0.04em",
              color: statusColor,
            }}
          >
            {machine.name}
          </DrawerTitle>
          <DrawerDescription
            style={{ fontFamily: "VT323, monospace", fontSize: "1.1rem" }}
          >
            {machine.type} ·{" "}
            <span style={{ color: statusColor, fontWeight: "bold" }}>
              {machine.status}
            </span>
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-2 text-center">
          {isIdle && (
            <p
              style={{
                fontFamily: "VT323, monospace",
                fontSize: "1.3rem",
                color: "hsl(var(--duck-idle))",
              }}
            >
              ▶ This duck is FREE!
            </p>
          )}
          {isRunning && (
            <div
              className="inline-block px-5 py-3"
              style={{
                background: "hsl(var(--muted))",
                border: "2px solid hsl(var(--duck-running))",
                boxShadow: "3px 3px 0px hsl(var(--duck-running) / 0.4)",
              }}
            >
              <p
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "1.4rem",
                  color: "hsl(var(--duck-running))",
                  lineHeight: 1.3,
                }}
              >
                {machine.cycleMinutesRemaining}
                <span
                  style={{
                    fontFamily: "VT323, monospace",
                    fontSize: "1.1rem",
                    marginLeft: "6px",
                  }}
                >
                  min left
                </span>
              </p>
            </div>
          )}
          {isMaintenance && (
            <p
              style={{
                fontFamily: "VT323, monospace",
                fontSize: "1.3rem",
                color: "hsl(var(--duck-maintenance))",
              }}
            >
              ✖ This duck is broken
            </p>
          )}
        </div>

        <DrawerFooter>
          {/* Claim breadcrumbs */}
          {canClaim && isIdle && (
            <Button
              onClick={handleClaim}
              className="pixel-btn w-full gap-2"
              style={{
                ...pixelBtnBase,
                background: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
                border: "2px solid hsl(var(--accent-foreground) / 0.3)",
                boxShadow: "3px 3px 0px hsl(var(--px-shadow) / 0.8)",
                padding: "10px 0",
              }}
            >
              <Gift className="w-3 h-3" />
              CLAIM 🍞 10 BREADCRUMBS
            </Button>
          )}

          {/* Watch / Unwatch */}
          {isRunning && (
            <Button
              onClick={handleWatch}
              className="w-full gap-2"
              style={{
                ...pixelBtnBase,
                background: isWatched ? "hsl(var(--muted))" : "hsl(var(--secondary))",
                color: isWatched
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--secondary-foreground))",
                border: "2px solid hsl(var(--border))",
                padding: "10px 0",
              }}
            >
              {isWatched ? (
                <>
                  <BellOff className="w-3 h-3" />
                  UNWATCH DUCK 🔕
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3" />
                  WATCH DUCK 🔔
                </>
              )}
            </Button>
          )}

          <DrawerClose asChild>
            <Button
              variant="outline"
              style={{
                ...pixelBtnBase,
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                width: "100%",
                padding: "10px 0",
              }}
            >
              [ CLOSE ]
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DuckDrawer;
