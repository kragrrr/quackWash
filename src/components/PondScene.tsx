import { Machine } from "@/data/mockData";
import PixelDuck from "./PixelDuck";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface PondSceneProps {
    machines: Machine[];
    onDuckClick: (machine: Machine) => void;
    isWatched: (id: string) => boolean;
}

/** Color filter strings — combined inline to avoid CSS override */
const DUCK_FILTERS: Record<string, string> = {
    washer: "hue-rotate(170deg) saturate(2.8) brightness(1.1) drop-shadow(0 2px 0 rgba(0,0,0,0.25))",
    dryer: "hue-rotate(330deg) saturate(3) brightness(1.1) drop-shadow(0 2px 0 rgba(0,0,0,0.25))",
    maint: "grayscale(100%) brightness(0.75) drop-shadow(0 2px 0 rgba(0,0,0,0.25))",
};

/** Check if (x, y) % is inside the pond ellipse */
function isInsidePond(x: number, y: number): boolean {
    const dx = (x - 50) / 38;
    const dy = (y - 50) / 40;
    return dx * dx + dy * dy <= 1;
}

/** Random point in the middle swimming zone (32–68% vertically) */
function randomSwimPoint(): { x: number; y: number } {
    let x: number, y: number;
    do {
        x = 20 + Math.random() * 60;
        y = 32 + Math.random() * 36;
    } while (!isInsidePond(x, y));
    return { x, y };
}

/**
 * Build a fixed grid of home positions for a bay.
 * Each machine gets its own designated slot that never changes.
 * Returns positions for `totalSlots` machines.
 */
function buildBaySlots(
    totalSlots: number,
    bayYStart: number,
    bayYEnd: number,
): { x: number; y: number }[] {
    if (totalSlots === 0) return [];
    const maxPerRow = 3;
    const totalRows = Math.ceil(totalSlots / maxPerRow);
    const remainder = totalSlots % maxPerRow;

    // Build row definitions: put the partial row first (top = narrow),
    // full rows below (wider part of pond).
    const rowDefs: number[] = []; // ducks per row, top to bottom
    if (remainder > 0) {
        rowDefs.push(remainder);
    }
    for (let r = 0; r < totalRows - (remainder > 0 ? 1 : 0); r++) {
        rowDefs.push(maxPerRow);
    }

    // Row y-positions spread evenly within the bay
    const rowYs: number[] = [];
    if (rowDefs.length === 1) {
        rowYs.push((bayYStart + bayYEnd) / 2);
    } else {
        for (let r = 0; r < rowDefs.length; r++) {
            rowYs.push(bayYStart + (r / (rowDefs.length - 1)) * (bayYEnd - bayYStart));
        }
    }

    const positions: { x: number; y: number }[] = [];
    for (let r = 0; r < rowDefs.length; r++) {
        const ducksInRow = rowDefs[r];
        const y = rowYs[r];

        // Pond width at this y using ellipse formula
        const dyNorm = (y - 50) / 40;
        const xExtent = 38 * Math.sqrt(Math.max(0, 1 - dyNorm * dyNorm));
        const xMin = 50 - xExtent + 4;
        const xMax = 50 + xExtent - 4;

        for (let c = 0; c < ducksInRow; c++) {
            let px: number;
            if (ducksInRow === 1) {
                px = 50;
            } else {
                px = xMin + (c / (ducksInRow - 1)) * (xMax - xMin);
            }
            positions.push({ x: px, y });
        }
    }
    return positions;
}

interface DuckSwimState {
    targetX: number;
    targetY: number;
    goingLeft: boolean;
    speed: number;
}

function initSwimState(): DuckSwimState {
    const target = randomSwimPoint();
    return {
        targetX: target.x,
        targetY: target.y,
        goingLeft: Math.random() > 0.5,
        speed: 3 + Math.random() * 3,
    };
}

const LABEL: Record<string, string> = {
    Idle: "FREE",
    Running: "",
    Maintenance: "DOWN",
};

export default function PondScene({
    machines,
    onDuckClick,
    isWatched,
}: PondSceneProps) {
    const [swimStates, setSwimStates] = useState<Map<string, DuckSwimState>>(new Map());
    const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // Separate all machines by type (order is stable from API)
    const allWashers = useMemo(() => machines.filter((m) => m.type === "Washer"), [machines]);
    const allDryers = useMemo(() => machines.filter((m) => m.type === "Dryer"), [machines]);

    // Fixed bay slots —  every washer/dryer has a permanent home position
    const washerSlots = useMemo(() => buildBaySlots(allWashers.length, 14, 28), [allWashers.length]);
    const dryerSlots = useMemo(() => buildBaySlots(allDryers.length, 72, 86), [allDryers.length]);

    // Build a map: machineId → home position
    const homePositions = useMemo(() => {
        const map = new Map<string, { x: number; y: number }>();
        allWashers.forEach((m, i) => {
            if (washerSlots[i]) map.set(m.id, washerSlots[i]);
        });
        allDryers.forEach((m, i) => {
            if (dryerSlots[i]) map.set(m.id, dryerSlots[i]);
        });
        return map;
    }, [allWashers, allDryers, washerSlots, dryerSlots]);

    const runningMachines = useMemo(() => machines.filter((m) => m.status === "Running"), [machines]);

    // Init swim states for running ducks
    useEffect(() => {
        setSwimStates((prev) => {
            const next = new Map(prev);
            for (const machine of runningMachines) {
                if (!next.has(machine.id)) {
                    next.set(machine.id, initSwimState());
                }
            }
            for (const id of next.keys()) {
                if (!runningMachines.find((m) => m.id === id)) {
                    next.delete(id);
                }
            }
            return next;
        });
    }, [runningMachines]);

    const pickNewTarget = useCallback((machineId: string) => {
        setSwimStates((prev) => {
            const state = prev.get(machineId);
            if (!state) return prev;
            const target = randomSwimPoint();
            const speed = 3 + Math.random() * 3;
            const next = new Map(prev);
            next.set(machineId, {
                targetX: target.x,
                targetY: target.y,
                goingLeft: target.x < state.targetX,
                speed,
            });
            return next;
        });
    }, []);

    useEffect(() => {
        for (const [, timer] of timerRefs.current) clearTimeout(timer);
        timerRefs.current.clear();

        for (const machine of runningMachines) {
            const state = swimStates.get(machine.id);
            if (!state) continue;
            const scheduleNext = () => {
                const timer = setTimeout(() => {
                    pickNewTarget(machine.id);
                    scheduleNext();
                }, state.speed * 1000);
                timerRefs.current.set(machine.id, timer);
            };
            scheduleNext();
        }

        return () => {
            for (const timer of timerRefs.current.values()) clearTimeout(timer);
        };
    }, [runningMachines.length, swimStates, pickNewTarget]);

    const pondWater = "hsl(210, 55%, 60%)";
    const pondDark = "hsl(210, 55%, 44%)";
    const pondBorder = "hsl(210, 45%, 36%)";
    const POND_PATH = "M 20 4 L 40 4 L 40 8 L 48 8 L 48 16 L 54 16 L 54 84 L 48 84 L 48 92 L 40 92 L 40 96 L 20 96 L 20 92 L 12 92 L 12 84 L 6 84 L 6 16 L 12 16 L 12 8 L 20 8 Z";

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <div
                className="relative w-full"
                style={{ paddingTop: "166.67%", maxWidth: "600px", margin: "0 auto" }}
            >
                <div className="absolute inset-0">
                    <svg viewBox="0 0 60 100" preserveAspectRatio="none" className="w-full h-full">
                        <defs>
                            <pattern id="pondGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                                <path d="M 6 0 L 0 0 0 6" fill="none" stroke={pondDark} strokeWidth="0.5" opacity="0.4" />
                            </pattern>
                        </defs>
                        <path d={POND_PATH} fill={pondDark} transform="translate(0, 3)" opacity={0.6} />
                        <path d={POND_PATH} fill={pondWater} stroke={pondBorder} strokeWidth="2" strokeLinejoin="miter" />
                        <path d={POND_PATH} fill="url(#pondGrid)" pointerEvents="none" />
                    </svg>

                    {/* Render every machine */}
                    {machines.map((machine) => {
                        const isRunning = machine.status === "Running";
                        const isMaintenance = machine.status === "Maintenance";
                        const isWasher = machine.type === "Washer";
                        const swim = isRunning ? swimStates.get(machine.id) : null;
                        const home = homePositions.get(machine.id);

                        // Position: swimming → swim target, otherwise → home slot
                        const posX = swim ? swim.targetX : home?.x ?? 50;
                        const posY = swim ? swim.targetY : home?.y ?? 50;
                        const goingLeft = swim ? swim.goingLeft : false;
                        const speed = swim ? swim.speed : 0;

                        const duckFilter = isMaintenance
                            ? DUCK_FILTERS.maint
                            : isWasher
                                ? DUCK_FILTERS.washer
                                : DUCK_FILTERS.dryer;

                        return (
                            <button
                                key={machine.id}
                                onClick={() => onDuckClick(machine)}
                                className="absolute flex flex-col items-center select-none focus:outline-none group"
                                style={{
                                    left: `${posX}%`,
                                    top: `${posY}%`,
                                    transform: "translate(-50%, -50%)",
                                    transition: isRunning
                                        ? `left ${speed}s linear, top ${speed}s linear`
                                        : "left 1s ease-out, top 1s ease-out", // Smooth return to bay
                                    zIndex: isRunning ? 10 : 5,
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                }}
                                aria-label={`${machine.name} – ${machine.status}`}
                            >
                                {/* Watch pip */}
                                {isWatched(machine.id) && isRunning && (
                                    <span style={{ fontSize: "12px", lineHeight: 1, marginBottom: "1px" }}>👁️</span>
                                )}

                                {/* Timer badge */}
                                {isRunning && machine.cycleMinutesRemaining != null && (
                                    <span
                                        style={{
                                            fontFamily: '"Press Start 2P", monospace',
                                            fontSize: "0.4rem",
                                            color: "#fff",
                                            background: isWasher ? "hsl(210 55% 35%)" : "hsl(28 55% 35%)",
                                            border: "1px solid rgba(255,255,255,0.4)",
                                            padding: "1px 4px",
                                            marginBottom: "2px",
                                            display: "block",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {machine.cycleMinutesRemaining}m
                                    </span>
                                )}

                                {/* Caution stripe */}
                                {isMaintenance && (
                                    <div
                                        className="caution-tape"
                                        style={{ width: "100%", height: "4px", marginBottom: "2px", opacity: 0.9 }}
                                    />
                                )}

                                {/* Duck sprite — only this flips */}
                                <div
                                    style={{
                                        filter: duckFilter,
                                        transition: "transform 0.5s ease-in-out",
                                        transform: `scaleX(${goingLeft ? -1 : 1})`,
                                    }}
                                >
                                    <PixelDuck className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[2rem]" />
                                </div>

                                {/* Status label */}
                                {LABEL[machine.status] && (
                                    <span
                                        style={{
                                            fontFamily: '"Press Start 2P", monospace',
                                            fontSize: "0.30rem",
                                            letterSpacing: "0.02em",
                                            marginTop: "1px",
                                            color: "#fff",
                                            background: isMaintenance
                                                ? "rgba(180,60,60,0.85)"
                                                : "hsla(162,45%,30%,0.7)",
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
                                        color: "rgba(255,255,255,0.9)",
                                        display: "block",
                                        marginTop: "1px",
                                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {machine.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
