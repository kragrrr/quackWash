import { Machine } from "@/data/mockData";
import { cn } from "@/lib/utils";
import PixelDuck from "./PixelDuck";

interface PondSceneProps {
    machines: Machine[];
    onDuckClick: (machine: Machine) => void;
    cosmeticEmoji?: string | null;
    isWatched: (id: string) => boolean;
}

/**
 * Positions N ducks evenly around an oval.
 * Returns { x, y } as percentages from the oval centre.
 * The oval has half-widths: a=44% (horizontal), b=35% (vertical).
 */
function ovalPositions(n: number): { x: number; y: number }[] {
    if (n === 0) return [];
    return Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2; // start at top
        return {
            x: 50 + 38 * Math.cos(angle),
            y: 50 + 30 * Math.sin(angle),
        };
    });
}

const LABEL: Record<string, string> = {
    Idle: "FREE",
    Running: "",
    Maintenance: "DOWN",
};

export default function PondScene({
    machines,
    onDuckClick,
    cosmeticEmoji,
    isWatched,
}: PondSceneProps) {
    const positions = ovalPositions(machines.length);

    // Unified pond palette (cool water blue for all)
    const pondWater = "hsl(210, 55%, 60%)";
    const pondDark = "hsl(210, 55%, 44%)";
    const pondBorder = "hsl(210, 45%, 36%)";

    // 8-bit blocky oval path for a 100x60 viewBox (5:3 aspect ratio)
    const POND_PATH = "M 20 4 L 80 4 L 80 10 L 90 10 L 90 20 L 96 20 L 96 40 L 90 40 L 90 50 L 80 50 L 80 56 L 20 56 L 20 50 L 10 50 L 10 40 L 4 40 L 4 20 L 10 20 L 10 10 L 20 10 Z";

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            {/* 8-bit Oval pond container (5:3 aspect ratio = 60% padding-top) */}
            <div
                className="relative w-full"
                style={{ paddingTop: "60%", maxWidth: "1200px", margin: "0 auto" }}
            >
                <div className="absolute inset-0">
                    <svg
                        viewBox="0 0 100 60"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                    >
                        <defs>
                            <pattern id="pondGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                                <path d="M 6 0 L 0 0 0 6" fill="none" stroke={pondDark} strokeWidth="0.5" opacity="0.4" />
                            </pattern>
                        </defs>
                        {/* 3D Drop shadow layer */}
                        <path d={POND_PATH} fill={pondDark} transform="translate(0, 3)" opacity={0.6} />

                        {/* Main Pond Water */}
                        <path d={POND_PATH} fill={pondWater} stroke={pondBorder} strokeWidth="2" strokeLinejoin="miter" />

                        {/* Grid overlay bound to the pond shape */}
                        <path d={POND_PATH} fill="url(#pondGrid)" pointerEvents="none" />
                    </svg>

                    {/* Ducks */}
                    {machines.map((machine, i) => {
                        const pos = positions[i];
                        const isIdle = machine.status === "Idle";
                        const isRunning = machine.status === "Running";
                        const isMaintenance = machine.status === "Maintenance";
                        const isWasher = machine.type === "Washer";

                        // Alternate swim directions
                        const swimCw = i % 2 === 0;
                        const swimDuration = 8 + (i % 3) * 2; // 8s, 10s, or 12s

                        // Dryers get amber tint, washers get teal tint, maint is grayscale
                        const duckColorClass = isMaintenance
                            ? "duck-maint"
                            : isWasher
                                ? "duck-washer"
                                : "duck-dryer";

                        return (
                            <button
                                key={machine.id}
                                onClick={() => onDuckClick(machine)}
                                className="absolute flex flex-col items-center select-none focus:outline-none group"
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    transform: "translate(-50%, -50%)",
                                    zIndex: isRunning ? 10 : 5,
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                }}
                                aria-label={`${machine.name} – ${machine.status}`}
                            >
                                {/* Swimming orbit wrapper — only for Running */}
                                <div
                                    style={
                                        isRunning
                                            ? {
                                                animation: `${swimCw ? "swim-cw" : "swim-ccw"} ${swimDuration}s steps(8, end) infinite`,
                                                animationDelay: `${-i * (swimDuration / machines.length)}s`,
                                            }
                                            : undefined
                                    }
                                >
                                    {/* Duck container */}
                                    <div
                                        style={
                                            isIdle
                                                ? { animation: "duck-wander 4s ease-in-out infinite", animationDelay: `${i * 0.7}s` }
                                                : undefined
                                        }
                                        className={cn("flex flex-col items-center", duckColorClass)}
                                    >
                                        {/* Watch eye pip */}
                                        {isWatched(machine.id) && isRunning && (
                                            <span style={{ fontSize: "10px", lineHeight: 1, marginBottom: "1px" }}>👁️</span>
                                        )}

                                        {/* Timer badge */}
                                        {isRunning && machine.cycleMinutesRemaining != null && (
                                            <span
                                                style={{
                                                    fontFamily: '"Press Start 2P", monospace',
                                                    fontSize: "0.35rem",
                                                    color: "#fff",
                                                    background: isWasher ? "hsl(210 55% 35%)" : "hsl(28 55% 35%)",
                                                    border: "1px solid rgba(255,255,255,0.4)",
                                                    padding: "1px 3px",
                                                    marginBottom: "2px",
                                                    display: "block",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {machine.cycleMinutesRemaining}m
                                            </span>
                                        )}

                                        {/* Caution stripe for maintenance */}
                                        {isMaintenance && (
                                            <div
                                                className="caution-tape"
                                                style={{
                                                    width: "100%",
                                                    height: "4px",
                                                    marginBottom: "2px",
                                                    opacity: 0.9,
                                                }}
                                            />
                                        )}

                                        {/* The 8-bit SVG Duck (with flip animation attached here) */}
                                        <div
                                            style={{
                                                filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.25))",
                                                ...(isRunning ? {
                                                    animation: `${swimCw ? "flip-cw" : "flip-ccw"} ${swimDuration}s steps(1, end) infinite`,
                                                    animationDelay: `${-i * (swimDuration / machines.length)}s`,
                                                } : {}),
                                            }}
                                        >
                                            <PixelDuck className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-[2rem]" />
                                        </div>

                                        {/* Cosmetic overlay */}
                                        {cosmeticEmoji && !isMaintenance && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: -4,
                                                    left: 0,
                                                    fontSize: "10px",
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                {cosmeticEmoji}
                                            </span>
                                        )}

                                        {/* Status label */}
                                        {LABEL[machine.status] && (
                                            <span
                                                style={{
                                                    fontFamily: '"Press Start 2P", monospace',
                                                    fontSize: "0.3rem",
                                                    letterSpacing: "0.02em",
                                                    marginTop: "2px",
                                                    color: "#fff",
                                                    background: isMaintenance
                                                        ? "rgba(180,60,60,0.85)"
                                                        : isRunning
                                                            ? isWasher ? "hsla(210,55%,30%,0.85)" : "hsla(28,55%,30%,0.85)"
                                                            : isWasher ? "hsla(162,45%,30%,0.7)" : "hsla(162,45%,30%,0.7)",
                                                    padding: "1px 3px",
                                                    display: "block",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {LABEL[machine.status]}
                                            </span>
                                        )}

                                        {/* Machine name */}
                                        <span
                                            style={{
                                                fontFamily: "VT323, monospace",
                                                fontSize: "0.75rem",
                                                color: "rgba(255,255,255,0.85)",
                                                display: "block",
                                                marginTop: "1px",
                                            }}
                                        >
                                            {machine.name}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
