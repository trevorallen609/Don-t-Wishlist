import type { LibraryGame, SaleCandidate } from "@/lib/schemas";

export function game(
  overrides: Partial<LibraryGame> & Pick<LibraryGame, "id" | "title" | "status">,
): LibraryGame {
  return {
    hoursPlayed: null,
    notes: null,
    ...overrides,
  };
}

export const BACKLOG_LIBRARY: LibraryGame[] = [
  game({ id: "1", title: "Starfield", status: "abandoned", hoursPlayed: 12 }),
  game({ id: "2", title: "Cyberpunk 2077", status: "abandoned", hoursPlayed: 6 }),
  game({ id: "3", title: "Elden Ring", status: "finished", hoursPlayed: 90 }),
  game({ id: "4", title: "Hades II", status: "abandoned", hoursPlayed: 4 }),
];

export const SALE_SLATE: SaleCandidate[] = [
  { title: "Destiny 2 expansion", price: 40, note: "live service" },
  { title: "Call of Duty: Black Ops 6", price: 50 },
  { title: "Celeste", price: 5 },
  { title: "Dragon Age: The Veilguard", price: 30, note: "RPG" },
];
