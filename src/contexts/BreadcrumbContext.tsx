import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DUCK_COSMETICS, DuckCosmetic } from "@/data/mockData";

// ─── Types ───────────────────────────────────────────────────
interface BreadcrumbState {
    breadcrumbs: number;
    unlockedCosmetics: string[];
    activeCosmeticId: string | null;
    /** Maps machineId → timestamp (ms) when cycle completed */
    completionTimestamps: Record<string, number>;
}

interface BreadcrumbContextValue extends BreadcrumbState {
    addBreadcrumbs: (n: number) => void;
    spendBreadcrumbs: (n: number) => boolean;
    unlockCosmetic: (id: string) => boolean;
    setActiveCosmetic: (id: string | null) => void;
    recordCompletion: (machineId: string) => void;
    claimBreadcrumbs: (machineId: string) => boolean;
    canClaim: (machineId: string) => boolean;
    getCosmetics: () => (DuckCosmetic & { owned: boolean; active: boolean })[];
    activeCosmeticEmoji: string | null;
}

const STORAGE_KEY = "quackwash_breadcrumbs";
const CLAIM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const CLAIM_AMOUNT = 10;

function loadState(): BreadcrumbState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return {
        breadcrumbs: 0,
        unlockedCosmetics: [],
        activeCosmeticId: null,
        completionTimestamps: {},
    };
}

function saveState(state: BreadcrumbState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<BreadcrumbState>(loadState);

    // Persist to localStorage on every state change
    useEffect(() => {
        saveState(state);
    }, [state]);

    const addBreadcrumbs = useCallback((n: number) => {
        setState((prev) => ({ ...prev, breadcrumbs: prev.breadcrumbs + n }));
    }, []);

    const spendBreadcrumbs = useCallback((n: number): boolean => {
        let success = false;
        setState((prev) => {
            if (prev.breadcrumbs >= n) {
                success = true;
                return { ...prev, breadcrumbs: prev.breadcrumbs - n };
            }
            return prev;
        });
        return success;
    }, []);

    const unlockCosmetic = useCallback((id: string): boolean => {
        const cosmetic = DUCK_COSMETICS.find((c) => c.id === id);
        if (!cosmetic) return false;

        let success = false;
        setState((prev) => {
            if (prev.unlockedCosmetics.includes(id)) return prev;
            if (prev.breadcrumbs < cosmetic.cost) return prev;
            success = true;
            return {
                ...prev,
                breadcrumbs: prev.breadcrumbs - cosmetic.cost,
                unlockedCosmetics: [...prev.unlockedCosmetics, id],
            };
        });
        return success;
    }, []);

    const setActiveCosmetic = useCallback((id: string | null) => {
        setState((prev) => ({ ...prev, activeCosmeticId: id }));
    }, []);

    const recordCompletion = useCallback((machineId: string) => {
        setState((prev) => ({
            ...prev,
            completionTimestamps: {
                ...prev.completionTimestamps,
                [machineId]: Date.now(),
            },
        }));
    }, []);

    const canClaim = useCallback(
        (machineId: string): boolean => {
            const ts = state.completionTimestamps[machineId];
            if (!ts) return false;
            return Date.now() - ts <= CLAIM_WINDOW_MS;
        },
        [state.completionTimestamps]
    );

    const claimBreadcrumbs = useCallback(
        (machineId: string): boolean => {
            const ts = state.completionTimestamps[machineId];
            if (!ts) return false;
            if (Date.now() - ts > CLAIM_WINDOW_MS) return false;

            setState((prev) => {
                const { [machineId]: _, ...rest } = prev.completionTimestamps;
                return {
                    ...prev,
                    breadcrumbs: prev.breadcrumbs + CLAIM_AMOUNT,
                    completionTimestamps: rest,
                };
            });
            return true;
        },
        [state.completionTimestamps]
    );

    const getCosmetics = useCallback(() => {
        return DUCK_COSMETICS.map((c) => ({
            ...c,
            owned: state.unlockedCosmetics.includes(c.id),
            active: state.activeCosmeticId === c.id,
        }));
    }, [state.unlockedCosmetics, state.activeCosmeticId]);

    const activeCosmeticEmoji = state.activeCosmeticId
        ? DUCK_COSMETICS.find((c) => c.id === state.activeCosmeticId)?.emoji ?? null
        : null;

    return (
        <BreadcrumbContext.Provider
            value={{
                ...state,
                addBreadcrumbs,
                spendBreadcrumbs,
                unlockCosmetic,
                setActiveCosmetic,
                recordCompletion,
                claimBreadcrumbs,
                canClaim,
                getCosmetics,
                activeCosmeticEmoji,
            }}
        >
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbs() {
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) {
        throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
    }
    return ctx;
}
