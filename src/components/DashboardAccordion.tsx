import { useState, useCallback } from "react";
import { Machine } from "@/data/mockData";
import { useWeather } from "@/hooks/useWeather";
import { useTransport } from "@/hooks/useTransport";
import { ChevronDown, ChevronUp, Droplets, Sun, Moon, CloudRain, Cloud, CloudLightning, Snowflake, BusFront, CloudSun, CloudMoon, Hand, Clock, Timer, UtensilsCrossed } from "lucide-react";
import type { DinnerMenu } from "@/types/dinnerMenu";

interface DashboardAccordionProps {
    machines: Machine[];
    onShowMachineDetails: () => void;
    dinnerMenu?: DinnerMenu | null;
    showDinnerSection?: boolean;
    showDinnerAdminButton?: boolean;
    onDinnerAdminClick?: () => void;
}

const PixelCard = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="pixel-border bg-card text-card-foreground p-3 sm:p-4 mb-4" style={{ backgroundColor: "hsl(var(--card))" }}>
            <button
                className="w-full flex items-center justify-between"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-sm sm:text-base">{title}</h2>
                </div>
                {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {open && (
                <div className="mt-4 pt-3 border-t-2 border-border/50 border-dashed animate-in slide-in-from-top-2">
                    {children}
                </div>
            )}
        </div>
    );
};

const formatDepartureTime = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

export default function DashboardAccordion({
    machines,
    onShowMachineDetails,
    dinnerMenu,
    showDinnerSection = false,
    showDinnerAdminButton = false,
    onDinnerAdminClick,
}: DashboardAccordionProps) {
    const [showHint, setShowHint] = useState(true);
    const [showActualTime, setShowActualTime] = useState(false);

    const handleLaundryClick = useCallback(() => {
        setShowHint(false);
        onShowMachineDetails();
    }, [onShowMachineDetails]);

    const { data: weather, isLoading: loadingWeather } = useWeather();
    const { data: shuttlesToUOW = [], isLoading: loadingShuttlesTo } = useTransport(["2500122"]);
    const { data: shuttlesFromUOW = [], isLoading: loadingShuttlesFrom } = useTransport(["250019", "2500354", "2500355"]);

    // Compute Laundry Stats
    const freeWashers = machines.filter(m => m.type === "Washer" && m.status === "Idle").length;
    const freeDryers = machines.filter(m => m.type === "Dryer" && m.status === "Idle").length;
    const finishingSoon = machines.filter(m => m.status === "Running" && m.cycleMinutesRemaining && m.cycleMinutesRemaining <= 10).length;

    let WeatherIcon = Sun;
    let weatherEmoji = '☀️';

    if (weather) {
        if (weather.isThunder) {
            WeatherIcon = CloudLightning;
            weatherEmoji = '⛈️';
        } else if (weather.isSnowing) {
            WeatherIcon = Snowflake;
            weatherEmoji = '❄️';
        } else if (weather.isRaining) {
            WeatherIcon = CloudRain;
            weatherEmoji = '🌧️';
        } else if (weather.isCloudy) {
            WeatherIcon = Cloud;
            weatherEmoji = '☁️';
        } else if (weather.isPartlyCloudy) {
            WeatherIcon = weather.isDay ? CloudSun : CloudMoon;
            weatherEmoji = weather.isDay ? '⛅️' : '☁️';
        } else {
            WeatherIcon = weather.isDay ? Sun : Moon;
            weatherEmoji = weather.isDay ? '☀️' : '🌙';
        }
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-2 mt-4 px-2">

            {/* 1. Laundry Room */}
            <PixelCard title="Laundry Room" icon={Droplets} defaultOpen={true}>
                <div className="flex flex-col gap-3 font-body cursor-pointer hover:bg-black/5 p-2 rounded transition-colors relative" onClick={handleLaundryClick}>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 pixel-border border-[1px]" />
                        <span>{freeWashers} washers free</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 pixel-border border-[1px]" />
                        <span>{finishingSoon} finishing soon</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 pixel-border border-[1px]" />
                        <span>{freeDryers} dryers free</span>
                    </div>

                    {showHint && (
                        <div
                            className="flex items-center justify-center gap-1.5 mt-1 py-1.5 rounded-md bg-foreground/10 animate-pulse"
                            style={{ fontFamily: '"VT323", monospace' }}
                        >
                            <Hand className="w-4 h-4 text-foreground/70 animate-bounce" style={{ animationDuration: "1.4s" }} />
                            <span className="text-sm text-foreground/70 tracking-wide">Tap to see the pond</span>
                        </div>
                    )}

                    <div className="text-right mt-1 text-xs text-muted-foreground" style={{ fontFamily: '"VT323", monospace' }}>
                        Updated just now <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />
                    </div>
                </div>
            </PixelCard>

            {showDinnerSection && (
                <PixelCard title="What's for Dinner?" icon={UtensilsCrossed} defaultOpen={true}>
                    <div className="flex flex-col gap-3 font-body">
                        {dinnerMenu ? (
                            <>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-sm">{dinnerMenu.title}</h3>
                                        <p className="text-xs text-muted-foreground">{dinnerMenu.dateLabel}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        Updated {new Date(dinnerMenu.updatedAt).toLocaleString()}
                                    </span>
                                </div>

                                {dinnerMenu.type === "text" && (
                                    <div className="rounded border border-dashed border-border/60 bg-background/60 p-3 text-sm whitespace-pre-wrap break-words">
                                        {dinnerMenu.text}
                                    </div>
                                )}

                                {dinnerMenu.type === "image" && dinnerMenu.filePath && (
                                    <div className="rounded border border-dashed border-border/60 bg-background/60 p-2 max-h-[420px] overflow-hidden">
                                        <img
                                            src={dinnerMenu.filePath}
                                            alt="Dinner menu"
                                            className="w-full max-h-[400px] object-contain mx-auto"
                                        />
                                    </div>
                                )}

                                {dinnerMenu.type === "pdf" && dinnerMenu.filePath && (
                                    <div className="rounded border border-dashed border-border/60 bg-background/60 p-2">
                                        <iframe
                                            src={dinnerMenu.filePath}
                                            title="Dinner menu PDF"
                                            className="w-full h-[420px] border-0 rounded"
                                        />
                                        <a
                                            href={dinnerMenu.filePath}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block mt-2 text-xs underline text-primary"
                                        >
                                            Open PDF in new tab
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">No dinner menu available yet.</div>
                        )}

                        {showDinnerAdminButton && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={onDinnerAdminClick}
                                    className="pixel-btn px-3 py-1.5 text-xs bg-primary/15 hover:bg-primary/25 transition-colors"
                                >
                                    Catering Admin
                                </button>
                            </div>
                        )}
                    </div>
                </PixelCard>
            )}

            {/* 2. Shuttles */}
            <PixelCard title="UOW Shuttles" icon={BusFront} defaultOpen={true}>
                <div className="flex items-center justify-end mb-2 gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        {showActualTime ? "Departure" : "Time left"}
                    </span>
                    <button
                        onClick={() => setShowActualTime(!showActualTime)}
                        className="flex items-center gap-1 px-2 py-1 rounded pixel-border border-[1px] text-xs font-bold bg-primary/10 hover:bg-primary/20 transition-colors"
                        title={showActualTime ? "Show time remaining" : "Show departure time"}
                    >
                        {showActualTime ? <Timer className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 font-body">
                    {/* To UOW */}
                    <div className="flex flex-col gap-3">
                        <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">To UOW</div>
                        {loadingShuttlesTo ? (
                            <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
                        ) : shuttlesToUOW.length > 0 ? (
                            shuttlesToUOW.map((shuttle) => (
                                <div key={shuttle.id} className="flex items-center gap-1.5">
                                    <span className="text-sm">🚍</span>
                                    <span className="font-bold text-sm">
                                        {showActualTime
                                            ? formatDepartureTime(shuttle.departureTime)
                                            : `${shuttle.countdownMinutes} m`}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto">({shuttle.route})</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground">No shuttles</div>
                        )}
                    </div>

                    {/* From UOW */}
                    <div className="flex flex-col gap-3 border-l-2 border-dashed border-border/50 pl-4">
                        <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">From UOW</div>
                        {loadingShuttlesFrom ? (
                            <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
                        ) : shuttlesFromUOW.length > 0 ? (
                            shuttlesFromUOW.map((shuttle) => (
                                <div key={shuttle.id} className="flex items-center gap-1.5">
                                    <span className="text-sm">🚍</span>
                                    <span className="font-bold text-sm">
                                        {showActualTime
                                            ? formatDepartureTime(shuttle.departureTime)
                                            : `${shuttle.countdownMinutes} m`}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto">({shuttle.route})</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground">No shuttles</div>
                        )}
                    </div>
                </div>
            </PixelCard>

            {/* 3. Weather */}
            <PixelCard title="Weather" icon={WeatherIcon} defaultOpen={true}>
                {loadingWeather ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Loading weather...</div>
                ) : weather ? (
                    <div className="flex flex-col gap-3 font-body">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{weatherEmoji}</span>
                            <span className="font-bold">{weather.temperature}°C and {weather.condition.toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">☁️</span>
                            <span className="text-muted-foreground text-sm">{weather.forecastSummary}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">Unable to load weather</div>
                )}
            </PixelCard>

        </div>
    );
}
