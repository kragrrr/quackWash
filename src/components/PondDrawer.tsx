import { Machine } from "@/data/mockData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import PondScene from "@/components/PondScene";
import PixelDuck from "@/components/PixelDuck";

interface PondDrawerProps {
    machines: Machine[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDuckClick: (machine: Machine) => void;
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

const PondDrawer = ({ machines, open, onOpenChange, onDuckClick }: PondDrawerProps) => {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                className="max-h-[90vh]"
                style={{
                    background: "hsl(var(--card))",
                    borderTop: `4px solid hsl(var(--duck-idle))`,
                    borderRadius: "0px",
                    boxShadow: `0px -4px 0px hsl(var(--duck-idle) / 0.6)`,
                }}
            >
                <DrawerHeader className="text-center pb-0">
                    <DrawerTitle
                        style={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: "0.85rem",
                            letterSpacing: "0.04em",
                            color: "hsl(var(--card-foreground))",
                        }}
                    >
                        Machine Details
                    </DrawerTitle>
                </DrawerHeader>

                <div className="overflow-y-auto px-2 sm:px-4 py-4 hide-scrollbar">
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pb-4">
                        <div className="flex items-center gap-1.5">
                            <PixelDuck className="text-xl sm:text-2xl" style={{ filter: "hue-rotate(170deg) saturate(2.8) brightness(1.1) drop-shadow(0 2px 0 rgba(0,0,0,0.25))" }} />
                            <span className="text-sm sm:text-base" style={{ fontFamily: "VT323, monospace", color: "hsl(210 45% 36%)" }}>= Washer</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <PixelDuck className="text-xl sm:text-2xl" style={{ filter: "hue-rotate(330deg) saturate(3) brightness(1.1) drop-shadow(0 2px 0 rgba(0,0,0,0.25))" }} />
                            <span className="text-sm sm:text-base" style={{ fontFamily: "VT323, monospace", color: "hsl(28 45% 38%)" }}>= Dryer</span>
                        </div>
                    </div>

                    <div className="flex justify-center items-start w-full">
                        <div className="w-full max-w-md">
                            <PondScene
                                machines={machines}
                                onDuckClick={onDuckClick}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 pt-2">
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
                            [ CLOSE POND ]
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default PondDrawer;
