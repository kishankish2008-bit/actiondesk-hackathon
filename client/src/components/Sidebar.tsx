import React from 'react';
import { ShieldCheck, ChevronDown, Globe } from 'lucide-react';
import { ProviderDescriptor } from '../../../shared/types.js';

interface SidebarProps {
  currentStatus?: string;
  defaultOpen?: boolean;
  providers?: ProviderDescriptor[];
}

export const Sidebar: React.FC<SidebarProps> = ({ defaultOpen = false, providers = [] }) => (
  <aside aria-label="Provider connections and safety" className="w-full space-y-3">
    <details
      open={defaultOpen}
      className="surface-card bg-white border border-zinc-300 rounded-xl overflow-hidden group"
    >
      <summary className="px-4 py-3.5 flex items-center justify-between gap-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 select-none">
        <span className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-zinc-700" aria-hidden="true" />
          Provider connection status
        </span>
        <ChevronDown
          className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-zinc-200 text-xs text-zinc-700 space-y-2.5">
        <p className="text-zinc-600 leading-relaxed">
          Connected partner APIs return current listings. When an API is unavailable, ActionDesk
          opens the provider’s official site and does not show substitute results.
        </p>
        {providers.length ? (
          <ul className="space-y-2">
            {providers.map((provider) => (
              <li key={provider.id} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <strong className="text-zinc-900">{provider.name}</strong>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${provider.connected ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-amber-50 text-amber-950 border-amber-300'}`}
                  >
                    {provider.connected ? 'Credentials configured' : 'Official site handoff'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">{provider.statusReason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
            Provider status could not be loaded. Live search is unavailable until connection status
            is confirmed.
          </p>
        )}
      </div>
    </details>
    <details className="surface-card bg-white border border-zinc-300 rounded-xl overflow-hidden group">
      <summary className="px-4 py-3.5 flex items-center justify-between gap-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 select-none">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          Account and payment boundary
        </span>
        <ChevronDown
          className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-zinc-200 text-xs text-zinc-700 space-y-2">
        <p>Partner API credentials stay on the server and are not sent to the browser.</p>
        <p>
          ActionDesk does not request passwords, one-time codes, card details, or bank credentials.
          You sign in and pay directly with the provider.
        </p>
        <p>
          Product details, stock, fares, and prices can change; verify them on the official site
          before purchase.
        </p>
      </div>
    </details>
  </aside>
);
