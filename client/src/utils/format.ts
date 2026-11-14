import { TaskStatus, TrainItinerary, ProductItem } from '../../../shared/types.js';

export function formatMoney(amount: number, currency = 'INR'): string {
  const normalizedCurrency = currency === 'USD' ? 'USD' : 'INR';
  return new Intl.NumberFormat(normalizedCurrency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === 'INR' ? 0 : 2,
  }).format(amount);
}

export function formatInrPrice(amount: number, currency = 'INR'): string {
  return formatMoney(amount, currency);
}

export function formatTrainPrice(train: TrainItinerary): {
  totalFormatted: string;
  perPassengerFormatted: string;
} {
  const currency = train.currency || 'INR';
  return {
    totalFormatted: formatMoney(train.totalPrice, currency),
    perPassengerFormatted: formatMoney(train.pricePerPassenger, currency),
  };
}

export function formatProductPrice(product: ProductItem): string {
  return formatMoney(product.price, product.currency);
}

export function formatBudgetTag(budget: number, currency?: string): string {
  return `Under ${formatMoney(budget, currency || 'INR')}`;
}

export function getPlainStatusLabel(status: TaskStatus): {
  label: string;
  tone: 'neutral' | 'amber' | 'blue' | 'emerald' | 'rose';
} {
  switch (status) {
    case 'received':
      return { label: 'Understanding request', tone: 'blue' };
    case 'needs_clarification':
      return { label: 'Waiting for your details', tone: 'amber' };
    case 'planned':
      return { label: 'Plan ready', tone: 'blue' };
    case 'searching':
      return { label: 'Searching provider', tone: 'blue' };
    case 'provider_limitation':
      return { label: 'Official website handoff required', tone: 'amber' };
    case 'handoff_complete':
      return { label: 'Opened official website — continue there', tone: 'emerald' };
    case 'awaiting_selection':
      return { label: 'Waiting for your choice', tone: 'amber' };
    case 'provider_handoff_ready':
      return { label: 'Official listing ready', tone: 'emerald' };
    case 'complete':
      return { label: 'Answer ready', tone: 'emerald' };
    case 'cancelled':
      return { label: 'Stopped by you', tone: 'neutral' };
    case 'failed':
      return { label: 'Could not complete step', tone: 'rose' };
    default:
      return { label: 'In progress', tone: 'neutral' };
  }
}
