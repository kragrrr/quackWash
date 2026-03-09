import { useQuery } from "@tanstack/react-query";
import { fetchShuttleTimes, ShuttleDeparture } from "@/services/transportService";

export function useTransport(stopIdOrIds: string | string[] = "2500122") {
    const queryKey = Array.isArray(stopIdOrIds) ? stopIdOrIds.join(",") : stopIdOrIds;
    
    return useQuery<ShuttleDeparture[]>({
        queryKey: ["transport", queryKey],
        queryFn: () => fetchShuttleTimes(stopIdOrIds),
        refetchInterval: 30_000, // Poll every 30 seconds
        staleTime: 15_000,
        placeholderData: (prev) => prev,
    });
}
