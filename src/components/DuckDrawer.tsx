import { useState, useEffect } from "react";
import { Machine } from "@/data/mockData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PayPalPayButton from "./PayPalPayButton";

interface DuckDrawerProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: DuckDrawerProps) => {
  const { toast } = useToast();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Reset payment success when a new machine is selected or drawer opens
  useEffect(() => {
    if (open) {
      setPaymentSuccess(false);
      setTransactionId(null);
    }
  }, [open, machine?.id]);

  if (!machine) return null;

  const isIdle = machine.status === "Idle";
  const isRunning = machine.status === "Running";
  const isMaintenance = machine.status === "Maintenance";

  const handleWatch = () => {
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
          {isIdle && !paymentSuccess && (
            <div className="flex flex-col items-center w-full px-2">
              <p
                style={{
                  fontFamily: "VT323, monospace",
                  fontSize: "1.3rem",
                  color: "hsl(var(--duck-idle))",
                }}
              >
                ▶ This duck is FREE!
              </p>
              {machine.price !== undefined && (
                <div className="mt-4 w-full px-2 max-w-[300px]">
                  <div className="mb-2 text-center" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.5rem", color: "hsl(var(--foreground))", lineHeight: "1.8" }}>
                    PAY ${machine.price.toFixed(2)} {machine.currency} TO START
                  </div>
                  <PayPalPayButton
                      machine={machine}
                      onSuccess={(details) => {
                          setPaymentSuccess(true);
                          setTransactionId(details.id);
                          toast({
                              title: "Payment Successful! 🎉",
                              description: `Transaction ID: ${details.id}`,
                              style: { backgroundColor: "hsl(var(--duck-idle))", color: "white" }
                          });
                      }}
                  />
                </div>
              )}
            </div>
          )}

          {isIdle && paymentSuccess && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
               <div className="text-5xl mb-3 animate-bounce">🦆🎉</div>
               <p
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: "0.75rem",
                    color: "hsl(var(--duck-idle))",
                    lineHeight: "1.5",
                  }}
               >
                 PAYMENT COMPLETE!
               </p>
               <p style={{ fontFamily: "VT323, monospace", fontSize: "1.3rem", marginTop: "8px" }}>
                 Machine is starting...
               </p>
               {transactionId && (
                   <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "monospace" }}>
                       TXN: {transactionId}
                   </p>
               )}
            </div>
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
