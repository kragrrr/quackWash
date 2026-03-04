import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { Machine, MachineType } from "@/data/mockData";

// Shape of each machine object returned by the Tangerpay API
interface TangerpayMachine {
    id: string;
    name: string;
    type: "Washer" | "Dryer";
    status: "Active" | "Maintenance";
    cycleInfo: {
        cycleStatus: "Idle" | "Running";
        cycleMinutesRemaining: number;
    };
}

interface TangerpayResponse {
    machines: TangerpayMachine[];
}

/**
 * Transforms a Tangerpay API machine into the app's Machine type.
 *
 * Mapping rules:
 * - API status "Maintenance"        → Machine.status "Maintenance"
 * - API cycleStatus "Running"       → Machine.status "Running"
 * - API cycleStatus "Idle"          → Machine.status "Idle"
 */
function transformMachine(raw: TangerpayMachine): Machine {
    if (raw.status === "Maintenance") {
        return {
            id: raw.id,
            name: raw.name,
            type: raw.type as MachineType,
            status: "Maintenance",
        };
    }

    if (raw.cycleInfo.cycleStatus === "Running") {
        return {
            id: raw.id,
            name: raw.name,
            type: raw.type as MachineType,
            status: "Running",
            cycleMinutesRemaining: raw.cycleInfo.cycleMinutesRemaining,
        };
    }

    return {
        id: raw.id,
        name: raw.name,
        type: raw.type as MachineType,
        status: "Idle",
    };
}

async function fetchMachines(): Promise<Machine[]> {
    const res = await fetch("/api/tangerpay/Sites/e8ef41ec");
    if (!res.ok) {
        throw new Error(`API responded with ${res.status}`);
    }
    const data: TangerpayResponse = await res.json();
    return data.machines.map(transformMachine);
}

export function useMachines() {
    const query = useQuery<Machine[]>({
        queryKey: ["machines"],
        queryFn: fetchMachines,
        refetchInterval: 60_000, // Poll every 60 seconds
        retry: 2,
        staleTime: 30_000,
        // If the query fails, keep previous data visible (stale-while-revalidate)
        placeholderData: (prev) => prev,
    });

    // Show a toast when the query enters an error state
    useEffect(() => {
        if (query.isError) {
            toast.error("🥶 Pond is frozen!", {
                description: "Can't reach the laundry API. Showing last known data.",
                duration: 5000,
            });
        }
    }, [query.isError]);

    return query;
}
