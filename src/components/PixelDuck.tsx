import { memo } from "react";
import { cn } from "@/lib/utils";

const DUCK_SPRITE = [
    "      BBBB      ",
    "     BYYYYB     ",
    "    BYYEEYBOO   ",
    "    BYYYYYBOOOO ",
    "    BYYYYYBOOO  ",
    "     BYYYB      ",
    "  B   BYYB      ",
    " BBYYYYYYBB     ",
    " BYYYYYYYYYB    ",
    "BYYDDDDYYYYYB   ",
    "BYYDDDDYYYYYB   ",
    " BYYYYYYYYYB    ",
    "  BBBBBBBBB     "
];

const COLORS: Record<string, string> = {
    B: "#111827", // Outline (Black/Dark Gray)
    Y: "#FCD34D", // Body (Yellow)
    E: "#1A202C", // Eye (Darker Black)
    O: "#F97316", // Beak (Orange)
    D: "#F59E0B", // Wing (Dark Yellow)
};

interface PixelDuckProps extends React.SVGProps<SVGSVGElement> { }

const PixelDuck = memo(({ className, ...props }: PixelDuckProps) => {
    // Sprite grid is 16x13
    const width = 16;
    const height = 13;

    const rects: React.ReactNode[] = [];

    for (let y = 0; y < DUCK_SPRITE.length; y++) {
        const row = DUCK_SPRITE[y];
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            if (char !== " ") {
                rects.push(
                    <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                        fill={COLORS[char]}
                    />
                );
            }
        }
    }

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            shapeRendering="crispEdges" // Enforces blocky pixel rendering
            className={cn("w-[1em] h-[1em]", className)} // Default to 1em size, easily overridden
            {...props}
        >
            {rects}
        </svg>
    );
});

PixelDuck.displayName = "PixelDuck";

export default PixelDuck;
