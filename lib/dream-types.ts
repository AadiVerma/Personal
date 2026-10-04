/** Client-safe dream types and categories (no fs). */
export const DREAM_CATEGORIES = {
  career: { label: "Career", emoji: "🚀", hue: 265 },
  wealth: { label: "Wealth", emoji: "💎", hue: 45 },
  travel: { label: "Travel", emoji: "🌍", hue: 190 },
  health: { label: "Health", emoji: "🔥", hue: 15 },
  family: { label: "Love & Family", emoji: "💖", hue: 330 },
  mind: { label: "Mind & Soul", emoji: "🧘", hue: 160 },
  adventure: { label: "Adventure", emoji: "🏔️", hue: 210 },
  legacy: { label: "Legacy", emoji: "👑", hue: 290 },
} as const;

export type DreamCategory = keyof typeof DREAM_CATEGORIES;

export type Dream = {
  id: string;
  title: string;
  note?: string;
  emoji: string;
  category: DreamCategory;
  /** The year I'm calling it in by. */
  targetYear?: string;
  manifested: boolean;
  /** ISO date (YYYY-MM-DD) the dream came true. */
  manifestedOn?: string;
  createdAt: string;
};
