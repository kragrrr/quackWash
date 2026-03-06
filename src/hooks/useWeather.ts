import { useQuery } from "@tanstack/react-query";
import { fetchWeather, WeatherData } from "@/services/weatherService";

export function useWeather() {
    return useQuery<WeatherData>({
        queryKey: ["weather"],
        queryFn: fetchWeather,
        refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
        staleTime: 60_000,
        placeholderData: (prev) => prev,
    });
}
