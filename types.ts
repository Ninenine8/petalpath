
export interface FlowerSuggestion {
  name: string;
  botanicalName?: string;
  meaning?: string;
  wrappingTechniques: {
    occasion: string;
    description: string;
    materials: string[];
    styleNotes: string;
  }[];
  complementaryFlowers: string[];
  colorPalette: string[];
}

export interface SubscriptionWeek {
  week: number;
  theme: string;
  mainFlower: string;
  secondaryFlowers: string[];
  vibe: string;
  careTip: string;
}

export interface SubscriptionPlan {
  title: string;
  description: string;
  weeks: SubscriptionWeek[];
}

export enum AppMode {
  IDENTIFY = 'IDENTIFY',
  WRAPPING = 'WRAPPING',
  SUBSCRIPTION = 'SUBSCRIPTION'
}
