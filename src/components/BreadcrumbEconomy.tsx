import { useBreadcrumbs } from "@/contexts/BreadcrumbContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Lock, Unlock, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BreadcrumbEconomy = () => {
  const [open, setOpen] = useState(false);
  const { breadcrumbs, getCosmetics, unlockCosmetic, setActiveCosmetic, activeCosmeticId } = useBreadcrumbs();
  const { toast } = useToast();
  const cosmetics = getCosmetics();

  const handleBuy = (id: string, name: string, cost: number) => {
    if (breadcrumbs < cost) {
      toast({
        title: "🍞 Not enough breadcrumbs!",
        description: `You need ${cost - breadcrumbs} more breadcrumbs for ${name}.`,
      });
      return;
    }
    const success = unlockCosmetic(id);
    if (success) {
      toast({
        title: `🎉 Unlocked ${name}!`,
        description: "You can now equip it from the Duck Shop.",
      });
    }
  };

  const handleEquip = (id: string, name: string) => {
    if (activeCosmeticId === id) {
      setActiveCosmetic(null);
      toast({ title: "🦆 Back to default duck" });
    } else {
      setActiveCosmetic(id);
      toast({ title: `✨ Equipped ${name}!` });
    }
  };

  const pixelBtnStyle: React.CSSProperties = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: "0.38rem",
    letterSpacing: "0.03em",
    borderRadius: "0px",
    border: "2px solid hsl(var(--border))",
    boxShadow: "2px 2px 0px hsl(var(--px-shadow, 210 28% 45%) / 0.8)",
    lineHeight: 2,
    height: "auto",
    padding: "4px 8px",
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mx-4 mb-4">
      <CollapsibleTrigger
        className="w-full px-4 py-3 flex items-center justify-between hover:brightness-95 transition-all"
        style={{
          background: "hsl(var(--card))",
          border: "2px solid hsl(var(--border))",
          boxShadow: "3px 3px 0px hsl(var(--px-shadow, 210 28% 45%) / 0.7)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" style={{ imageRendering: "pixelated" }}>🍞</span>
          <span
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "0.5rem",
              color: "hsl(var(--card-foreground))",
            }}
          >
            {breadcrumbs} CRUMBS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "VT323, monospace",
              fontSize: "1rem",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            DUCK SHOP
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1">
        <div
          className="p-4"
          style={{
            background: "hsl(var(--card))",
            border: "2px solid hsl(var(--border))",
            borderTop: "none",
            boxShadow: "3px 3px 0px hsl(var(--px-shadow, 210 28% 45%) / 0.7)",
          }}
        >
          {/* Shop header */}
          <div className="flex items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: "2px solid hsl(var(--border))" }}
          >
            {cosmetics.some((c) => c.owned) ? (
              <Unlock className="w-3 h-3 text-duck-idle" />
            ) : (
              <Lock className="w-3 h-3 text-muted-foreground" />
            )}
            <span
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "0.48rem",
                color: "hsl(var(--card-foreground))",
              }}
            >
              DUCK SHOP 🛍️
            </span>
          </div>

          {/* Cosmetics grid */}
          <div className="grid grid-cols-2 gap-2">
            {cosmetics.map((cosmetic) => (
              <div
                key={cosmetic.id}
                className="flex flex-col items-center gap-1.5 p-3"
                style={{
                  background: cosmetic.active
                    ? "hsl(var(--primary) / 0.12)"
                    : cosmetic.owned
                      ? "hsl(var(--muted) / 0.5)"
                      : "hsl(var(--muted) / 0.3)",
                  border: cosmetic.active
                    ? "2px solid hsl(var(--primary))"
                    : cosmetic.owned
                      ? "2px solid hsl(var(--border))"
                      : "2px dashed hsl(var(--border))",
                  boxShadow: cosmetic.active
                    ? "2px 2px 0px hsl(var(--primary) / 0.4)"
                    : "2px 2px 0px hsl(var(--px-shadow) / 0.5)",
                  opacity: cosmetic.owned ? 1 : 0.75,
                }}
              >
                <span className="text-2xl" style={{ imageRendering: "pixelated" }}>
                  {cosmetic.emoji}
                </span>
                <span
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: "0.38rem",
                    color: "hsl(var(--card-foreground))",
                    textAlign: "center",
                  }}
                >
                  {cosmetic.name}
                </span>
                <span
                  style={{
                    fontFamily: "VT323, monospace",
                    fontSize: "0.9rem",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  🍞 {cosmetic.cost}
                </span>

                {cosmetic.owned ? (
                  <Button
                    size="sm"
                    variant={cosmetic.active ? "default" : "outline"}
                    style={pixelBtnStyle}
                    onClick={() => handleEquip(cosmetic.id, cosmetic.name)}
                  >
                    {cosmetic.active ? (
                      <>
                        <Check className="w-2 h-2 mr-1" />
                        ON
                      </>
                    ) : (
                      "EQUIP"
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    style={pixelBtnStyle}
                    onClick={() => handleBuy(cosmetic.id, cosmetic.name, cosmetic.cost)}
                    disabled={breadcrumbs < cosmetic.cost}
                  >
                    BUY 🍞{cosmetic.cost}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BreadcrumbEconomy;
