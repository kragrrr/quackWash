import { useState } from "react";
import { Machine } from "@/data/mockData";
import { useWeather } from "@/hooks/useWeather";
import { useTransport } from "@/hooks/useTransport";
import { ChevronDown, ChevronUp, Droplets, Sun, Moon, CloudRain, Cloud, CloudLightning, Snowflake, BusFront, CloudSun, CloudMoon } from "lucide-react";

interface DashboardAccordionProps {
    machines: Machine[];
    onShowMachineDetails: () => void;
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

export default function DashboardAccordion({ machines, onShowMachineDetails }: DashboardAccordionProps) {
    const { data: weather, isLoading: loadingWeather } = useWeather();
    const { data: shuttlesToUOW = [], isLoading: loadingShuttlesTo } = useTransport("250010");
    const { data: shuttlesFromUOW = [], isLoading: loadingShuttlesFrom } = useTransport("250019");

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
                <div className="flex flex-col gap-3 font-body cursor-pointer hover:bg-black/5 p-2 rounded transition-colors" onClick={onShowMachineDetails}>
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

                    <div className="text-right mt-1 text-xs text-muted-foreground" style={{ fontFamily: '"VT323", monospace' }}>
                        Updated just now <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />
                    </div>
                </div>
            </PixelCard>

            {/* 2. Shuttles */}
            <PixelCard title="UOW Shuttles" icon={BusFront} defaultOpen={true}>
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
                                    <span className="font-bold text-sm">{shuttle.countdownMinutes} m</span>
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
                                    <span className="font-bold text-sm">{shuttle.countdownMinutes} m</span>
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
