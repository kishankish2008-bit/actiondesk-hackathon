/**
 * ActionDesk Shared Types
 * Core domain types, provider capability model, and state machine definitions
 * for live partner product search and official-site handoff workflows.
 */

export type TaskStatus =
  | 'received'
  | 'needs_clarification'
  | 'planned'
  | 'searching'
  | 'provider_limitation'
  | 'awaiting_selection'
  | 'provider_handoff_ready'
  | 'handoff_complete'
  | 'complete'
  | 'cancelled'
  | 'failed';

export type TaskType = 'train_search' | 'product_shopping' | 'general_info';

export type ProviderCapability = 'authorized_live_search' | 'user_handoff_only' | 'unavailable';

export type ResultDataOrigin = 'live_provider' | 'user_handoff';

export type TimeOfDayPreference = 'morning' | 'afternoon' | 'evening' | 'any';

export interface ProviderDescriptor {
  id: string;
  name: string;
  domain: TaskType;
  capability: ProviderCapability;
  connected: boolean;
  officialUrl: string;
  termsSummary: string;
  statusReason: string;
  requiredEnvVars?: string[];
}

export interface ProviderHandoffInfo {
  providerId: string;
  providerName: string;
  capability: ProviderCapability;
  officialUrl: string;
  handoffUrl: string;
  reason: string;
  termsNotice: string;
  didSearchProvider: boolean;
  didBookOrPurchase: false;
  availableHandoffs: Array<{
    providerId: string;
    providerName: string;
    officialUrl: string;
    handoffUrl: string;
    capability: ProviderCapability;
    statusReason: string;
  }>;
}

export interface TrainConstraints {
  origin: string;
  destination: string;
  date: string;
  timePreference: TimeOfDayPreference;
  passengerCount: number;
  budget?: number;
  currency: string;
  preferredProvider?: string;
}

export interface ShoppingConstraints {
  query: string;
  category?: string;
  budget?: number;
  currency: string;
  constraints: string[];
  preferredProvider?: string;
}

export interface GeneralInfoConstraints {
  query: string;
  topic?: string;
}

export type TaskConstraints =
  | { type: 'train_search'; data: TrainConstraints }
  | { type: 'product_shopping'; data: ShoppingConstraints }
  | { type: 'general_info'; data: GeneralInfoConstraints };

export interface TrainItinerary {
  id: string;
  carrier: string;
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  pricePerPassenger: number;
  totalPrice: number;
  currency?: string;
  availableSeats: number;
  cabinClass: 'Standard' | 'Business' | 'First';
  carbonEmissionKg: number;
  sourceLabel?: string;
  sourceUrl?: string;
  providerId?: string;
  providerName?: string;
  retrievedAt?: string;
  uncertaintyNote?: string;
  observedEvidence?: string[];
  verifiedInBrowser?: boolean;
  dataOrigin?: ResultDataOrigin;
}

export interface ProductItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  features: string[];
  inStock: boolean;
  deliveryDays: number;
  description: string;
  sourceLabel?: string;
  sourceUrl?: string;
  providerId?: string;
  providerName?: string;
  retrievedAt?: string;
  uncertaintyNote?: string;
  observedEvidence?: string[];
  verifiedInBrowser?: boolean;
  dataOrigin?: ResultDataOrigin;
}

export interface Recommendation<T = TrainItinerary | ProductItem> {
  selectedItem: T;
  reason: string;
  highlights: string[];
  tradeoffs: string[];
  alternatives: T[];
}

export interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  detail?: string;
  updatedAt?: string;
}

export interface AllowlistedSource {
  name: string;
  url: string;
  snippet: string;
  verified: boolean;
  retrievedAt?: string;
  note?: string;
}

export interface GeneralInfoResult {
  query: string;
  answer: string;
  sources: AllowlistedSource[];
  unverifiedClaims?: string[];
  retrievedAt?: string;
  isSimulatedKnowledgebase: boolean;
}

export interface ActionLogEvent {
  id: string;
  timestamp: string;
  type:
    | 'system'
    | 'parse'
    | 'clarify'
    | 'plan'
    | 'search'
    | 'provider_status'
    | 'recommend'
    | 'user_confirm'
    | 'browser_nav'
    | 'browser_fill'
    | 'browser_verify'
    | 'payment_gate'
    | 'handoff'
    | 'error'
    | 'cancel';
  message: string;
  level: 'info' | 'success' | 'warn' | 'error';
  metadata?: Record<string, unknown>;
}

export interface TaskState {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  rawInput: string;
  inputMode: 'text' | 'voice';
  taskType?: TaskType;
  targetProvider?: ProviderDescriptor;
  handoffInfo?: ProviderHandoffInfo;
  constraints?: TaskConstraints;
  missingFields?: string[];
  clarificationPrompt?: string;
  plan: PlanStep[];
  currentStepIndex: number;
  options: (TrainItinerary | ProductItem)[];
  recommendation?: Recommendation<TrainItinerary | ProductItem>;
  noResultsReason?: string;
  selectedOptionId?: string;
  selectionConfirmed?: boolean;
  infoResult?: GeneralInfoResult;
  actionLog: ActionLogEvent[];
  providerHandoff?: {
    providerId: string;
    url: string;
    providerName: string;
    message: string;
  };
  error?: string;
}
