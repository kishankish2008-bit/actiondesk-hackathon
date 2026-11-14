import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface ProviderHandoffCardProps {
  handoff: { providerId: string; url: string; providerName: string; message: string };
  onOpen: (providerId: string) => void;
}

export const ProviderHandoffCard: React.FC<ProviderHandoffCardProps> = ({ handoff, onOpen }) => (
  <section
    aria-labelledby="provider-handoff-heading"
    className="surface-card bg-white border-2 border-emerald-700 rounded-xl p-5 mb-6"
  >
    <div className="flex items-start gap-3">
      <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <h2 id="provider-handoff-heading" className="text-base font-semibold text-zinc-900">
          Continue on {handoff.providerName}
        </h2>
        <p className="text-sm text-zinc-700 mt-1">{handoff.message}</p>
        <p className="text-xs text-zinc-600 mt-2">
          Review the listing, seller, current price, availability, and terms before continuing.
          Sign-in and payment happen on the provider site.
        </p>
        <a
          href={handoff.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onOpen(handoff.providerId)}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-700 text-sm font-medium"
        >
          Open official listing <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  </section>
);
