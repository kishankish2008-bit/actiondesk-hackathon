import React from 'react';
import { ExternalLink, XCircle, ShieldCheck } from 'lucide-react';

interface ConfirmationGateProps {
  taskType?: 'train_search' | 'product_shopping' | 'general_info';
  onConfirm: (confirmed: boolean) => void;
  isLoading: boolean;
}

export const ConfirmationGate: React.FC<ConfirmationGateProps> = ({
  taskType,
  onConfirm,
  isLoading,
}) => (
  <section
    aria-labelledby="checkout-confirmation-heading"
    className="surface-card bg-white border-2 border-zinc-700 rounded-xl p-5 mb-6"
  >
    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
      Your review
    </span>
    <h2 id="checkout-confirmation-heading" className="text-base font-semibold text-zinc-900">
      Open this {taskType === 'train_search' ? 'itinerary' : 'product'} on the official provider
      site?
    </h2>
    <p className="text-sm text-zinc-700 mt-2 mb-4">
      ActionDesk will open the listing returned by the provider API. Sign in, choose delivery or
      passenger details, and complete payment directly on that site. ActionDesk will not enter
      personal or payment information.
    </p>
    <div className="flex items-start gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-800 mb-4">
      <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5" aria-hidden="true" />
      <span>Check the title, seller, final price, availability, and terms before checkout.</span>
    </div>
    <div className="flex flex-col sm:flex-row gap-2.5">
      <button
        type="button"
        onClick={() => onConfirm(true)}
        disabled={isLoading}
        className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-700 text-white font-semibold text-sm flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-50"
      >
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
        <span>Open official listing</span>
      </button>
      <button
        type="button"
        onClick={() => onConfirm(false)}
        disabled={isLoading}
        className="py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 font-medium text-sm flex items-center justify-center gap-1.5 border border-zinc-300 min-h-[42px] disabled:opacity-50"
      >
        <XCircle className="w-4 h-4" aria-hidden="true" />
        <span>Cancel</span>
      </button>
    </div>
  </section>
);
