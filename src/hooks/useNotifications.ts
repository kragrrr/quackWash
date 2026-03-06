import { useState, useEffect, useRef, useCallback } from "react";
import type { Machine } from "@/data/mockData";

const STORAGE_KEY = "quackwash_watches";

interface WatchState {
    watchedMachineIds: string[];
}

function loadState(): WatchState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return { watchedMachineIds: [] };
}

function saveState(state: WatchState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Register the service worker and request notification permission. */
async function ensureNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const result = await Notification.requestPermission();
    return result === "granted";
}

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) return null;
    try {
        return await navigator.serviceWorker.register("/sw.js");
    } catch {
        return null;
    }
}

async function sendNotification(title: string, body: string, tag: string) {
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) return;

    const reg = await registerSW();
    if (reg?.active) {
        reg.active.postMessage({
            type: "SHOW_NOTIFICATION",
            title,
            body,
            tag,
        });
    } else {
        // Fallback: use Notification API directly
        new Notification(title, { body, tag });
    }
}

export function useNotifications(machines: Machine[]) {
    const [watchedIds, setWatchedIds] = useState<Set<string>>(() => {
        const state = loadState();
        return new Set(state.watchedMachineIds);
    });

    // Track previous machine states to detect transitions
    const prevMachinesRef = useRef<Map<string, Machine>>(new Map());
    // Track which machines we've already notified about (to avoid repeat alerts)
    const notifiedRef = useRef<Set<string>>(new Set());

    // Persist state changes
    useEffect(() => {
        saveState({
            watchedMachineIds: Array.from(watchedIds),
        });
    }, [watchedIds]);

    // Register SW on mount
    useEffect(() => {
        registerSW();
    }, []);

    // Detect machine transitions and fire notifications
    useEffect(() => {
        if (!machines || machines.length === 0) return;

        const prevMap = prevMachinesRef.current;

        for (const machine of machines) {
            const prev = prevMap.get(machine.id);

            // "Watch this Duck": machine was running and now is idle
            if (
                watchedIds.has(machine.id) &&
                prev &&
                prev.status === "Running" &&
                machine.status === "Idle" &&
                !notifiedRef.current.has(machine.id)
            ) {
                notifiedRef.current.add(machine.id);
                sendNotification(
                    "QUACK! 🦆",
                    `Your laundry is done! ${machine.name} is now free.`,
                    `watch-${machine.id}`
                );
            }
        }

        // Update prev map for next comparison
        const newMap = new Map<string, Machine>();
        for (const m of machines) {
            newMap.set(m.id, m);
        }
        prevMachinesRef.current = newMap;

        // Clean up notification dedup for machines that are running again
        for (const id of notifiedRef.current) {
            const machine = machines.find((m) => m.id === id);
            if (machine && machine.status === "Running") {
                notifiedRef.current.delete(id);
            }
        }
    }, [machines, watchedIds]);

    const watchMachine = useCallback(async (machineId: string) => {
        await ensureNotificationPermission();
        setWatchedIds((prev) => {
            const next = new Set(prev);
            next.add(machineId);
            return next;
        });
        // Clear any previous notification state for this machine
        notifiedRef.current.delete(machineId);
    }, []);

    const unwatchMachine = useCallback((machineId: string) => {
        setWatchedIds((prev) => {
            const next = new Set(prev);
            next.delete(machineId);
            return next;
        });
        notifiedRef.current.delete(machineId);
    }, []);

    const isWatched = useCallback(
        (machineId: string) => watchedIds.has(machineId),
        [watchedIds]
    );

    return {
        watchedIds,
        watchMachine,
        unwatchMachine,
        isWatched,
        watchedCount: watchedIds.size,
    };
}
