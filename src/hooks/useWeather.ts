import { useQuery } from "@tanstack/react-query";
import {
    fetchWeather,
    WeatherData,
    RateLimitError,
    MissingAPIKeyError,
} from "@/services/weatherService";

export function useWeather() {
    return useQuery<WeatherData>({
        queryKey: ["weather"],
        queryFn: fetchWeather,
        refetchInterval: 5 * 60 * 1000,
        staleTime: 60_000,
        placeholderData: (prev) => prev,
        retry(failureCount, error) {
            if (error instanceof MissingAPIKeyError) return false;
            if (error instanceof RateLimitError) return false;
            return failureCount < 3;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    });
}
