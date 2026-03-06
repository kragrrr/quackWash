import { useQuery } from "@tanstack/react-query";
import { fetchShuttleTimes, ShuttleDeparture } from "@/services/transportService";

export function useTransport(stopId: string = "250010") {
    return useQuery<ShuttleDeparture[]>({
        queryKey: ["transport", stopId],
        queryFn: () => fetchShuttleTimes(stopId),
        refetchInterval: 30_000, // Poll every 30 seconds
        staleTime: 15_000,
        placeholderData: (prev) => prev,
    });
}
