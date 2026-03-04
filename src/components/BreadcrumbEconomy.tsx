import { DUCK_COSMETICS } from "@/data/mockData";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";

interface BreadcrumbEconomyProps {
  breadcrumbs: number;
}

const BreadcrumbEconomy = ({ breadcrumbs }: BreadcrumbEconomyProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mx-4 mb-4">
      <CollapsibleTrigger className="w-full bg-card rounded-2xl px-4 py-3 flex items-center justify-between border border-border hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍞</span>
          <span className="font-display font-bold text-sm text-card-foreground">
            Breadcrumbs: {breadcrumbs}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-body">Duck Shop</span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-display font-bold text-sm text-card-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Duck Shop 🔒
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DUCK_COSMETICS.map((cosmetic) => (
              <div
                key={cosmetic.id}
                className="bg-muted/50 rounded-xl p-3 flex flex-col items-center gap-1 opacity-60 border border-dashed border-border"
              >
                <span className="text-2xl">{cosmetic.emoji}</span>
                <span className="text-xs font-display font-bold text-card-foreground">
                  {cosmetic.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-body">
                  🍞 {cosmetic.cost}
                </span>
                <span className="text-[9px] text-muted-foreground font-body italic">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BreadcrumbEconomy;
