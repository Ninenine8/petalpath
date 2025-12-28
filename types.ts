
export interface FlowerCare {
  watering: string;
  sunlight: string;
  temperature: string;
}

export interface WeddingBouquet {
  style: string;
  description: string;
  stems: string[];
  stylingTip: string;
}

export interface EasyStyling {
  title: string;
  effortTime: string;
  vesselType: string;
  guide: string[];
  proTip: string;
}

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
  weddingBouquet?: WeddingBouquet;
  easyOption?: EasyStyling;
  complementaryFlowers: string[];
  colorPalette: string[];
  careInstructions: FlowerCare;
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
