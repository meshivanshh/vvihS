export type Region = 'Europe' | 'Asia' | 'Americas';
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type ClimatePreset = 'Coastal' | 'Alpine' | 'Urban';
export type StopCategory = 'Transit' | 'Stay' | 'Dining' | 'Sight' | 'Walk';

export interface ItineraryStop {
  id: string;
  time: string;
  title: string;
  category: StopCategory;
  neighborhood: string;
  estimatedCost: number;
  notes: string;
  confirmed: boolean;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  title: string;
  stops: ItineraryStop[];
}

export interface BudgetExpense {
  id: string;
  label: string;
  category: 'Transport' | 'Lodging' | 'Dining' | 'Activities' | 'Gear';
  amount: number;
  paid: boolean;
}

export interface PackingItem {
  id: string;
  label: string;
  category: 'Documents & Transit' | 'Apparel' | 'Optics & Tech' | 'Field Kit';
  packed: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destinationId?: string;
  destinationName: string;
  country: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetCap: number;
  currency: 'USD' | 'EUR' | 'JPY';
  climate: ClimatePreset;
  days: TripDay[];
  fixedExpenses: BudgetExpense[];
  packingList: PackingItem[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: Region;
  bestSeasons: Season[];
  climate: ClimatePreset;
  coordinates: string;
  idealDays: number;
  dailyEstimateUsd: number;
  imageUrl: string;
  imageAlt: string;
  figureCaption: string;
  kicker: string;
  summary: string;
  editorialNote: string;
  transitTip: string;
  recommendedStays: { name: string; area: string; nightlyRate: string }[];
  sampleDays: TripDay[];
}

export interface FieldDispatch {
  id: string;
  number: string;
  region: string;
  title: string;
  readTime: string;
  author: string;
  excerpt: string;
  body: string;
  linkedDestinationId: string;
}
