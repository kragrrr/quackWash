export type MachineStatus = "Idle" | "Running" | "Maintenance";
export type MachineType = "Washer" | "Dryer";

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  cycleMinutesRemaining?: number;
}

export interface DuckCosmetic {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
  cost: number;
}

export const MOCK_MACHINES: Machine[] = [
  { id: "w1", name: "Washer 1", type: "Washer", status: "Idle" },
  { id: "w2", name: "Washer 2", type: "Washer", status: "Running", cycleMinutesRemaining: 23 },
  { id: "w3", name: "Washer 3", type: "Washer", status: "Running", cycleMinutesRemaining: 7 },
  { id: "w4", name: "Washer 4", type: "Washer", status: "Idle" },
  { id: "w5", name: "Washer 5", type: "Washer", status: "Maintenance" },
  { id: "d1", name: "Dryer 1", type: "Dryer", status: "Idle" },
  { id: "d2", name: "Dryer 2", type: "Dryer", status: "Running", cycleMinutesRemaining: 42 },
  { id: "d3", name: "Dryer 3", type: "Dryer", status: "Idle" },
  { id: "d4", name: "Dryer 4", type: "Dryer", status: "Running", cycleMinutesRemaining: 15 },
  { id: "d5", name: "Dryer 5", type: "Dryer", status: "Idle" },
  { id: "d6", name: "Dryer 6", type: "Dryer", status: "Maintenance" },
];

export const DUCK_COSMETICS: DuckCosmetic[] = [
  { id: "pirate", name: "Pirate Duck", emoji: "🏴‍☠️", unlocked: false, cost: 50 },
  { id: "propeller", name: "Propeller Hat Duck", emoji: "🧢", unlocked: false, cost: 30 },
  { id: "sunglasses", name: "Cool Duck", emoji: "😎", unlocked: false, cost: 20 },
  { id: "crown", name: "Royal Duck", emoji: "👑", unlocked: false, cost: 100 },
];

export const MOCK_BREADCRUMBS = 42;
export const MOCK_NOTIFICATIONS = 3;
