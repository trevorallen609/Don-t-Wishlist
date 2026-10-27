import type { GameStatus } from "@/lib/types";

/** Seed / demo library used in mocks and empty-state examples. */
export const SAMPLE_LIBRARY: Array<{
  title: string;
  status: GameStatus;
  hoursPlayed?: number;
  notes?: string;
}> = [
  {
    title: "Baldur's Gate 3",
    status: "playing",
    hoursPlayed: 40,
    notes: "Actually finishing this one",
  },
  {
    title: "Cyberpunk 2077",
    status: "abandoned",
    hoursPlayed: 6,
    notes: "Got distracted after Act 1",
  },
  {
    title: "Hades II",
    status: "abandoned",
    hoursPlayed: 3,
    notes: "Early access itch faded",
  },
  {
    title: "Elden Ring",
    status: "finished",
    hoursPlayed: 95,
  },
  {
    title: "Starfield",
    status: "abandoned",
    hoursPlayed: 12,
    notes: "Procedural emptiness won",
  },
];

export const SAMPLE_SALE_CANDIDATES = [
  { title: "Dragon Age: The Veilguard", price: 29.99, note: "40% off RPG" },
  { title: "Call of Duty: Black Ops 6", price: 49.99, note: "Season pass bait" },
  { title: "Stardew Valley", price: 7.99, note: "Cozy classic" },
  { title: "Destiny 2 expansion", price: 39.99, note: "Live service FOMO" },
  { title: "Celeste", price: 4.99, note: "Short precision platformer" },
];
