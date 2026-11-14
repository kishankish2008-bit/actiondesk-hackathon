import React from 'react';
import { ExternalLink, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProviderHandoffInfo, TaskType } from '../../../shared/types.js';

interface ProviderLimitationCardProps {
  handoffInfo: ProviderHandoffInfo;
  taskType?: TaskType;
  searchSummary?: string;
  status: string;
  onOpenOfficialSite: (providerId: string, url: string) => void;
}

export const ProviderLimitationCard: React.FC<ProviderLimitationCardProps> = ({
  handoffInfo,
  taskType,
  searchSummary,
  status,
  onOpenOfficialSite,
}) => {
  const isHandoffComplete = status === 'handoff_complete';

  return (
    <section
      aria-labelledby="provider-limitation-heading"
      className="surface-card bg-white border-2 border-zinc-300 rounded-xl p-5 mb-6 space-y-4"
    >
      {/* Header & Capability Status Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-900 mt-0.5 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="provider-limitation-heading"
                className="text-base font-semibold text-zinc-900"
              >
                {handoffInfo.didSearchProvider
                  ? `No usable results from ${handoffInfo.providerName}`
                  : `Live search unavailable for ${handoffInfo.providerName}`}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
                User handoff only
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              {handoffInfo.didSearchProvider
                ? 'ActionDesk attempted the configured partner API, but it returned an error or no listings that met your filters.'
                : 'No live results are shown because a licensed search API is not configured for this provider.'}
            </p>
          </div>
        </div>
      </div>

      {searchSummary && (
        <div className="handoff-search-preview">
          <strong>Request understood</strong>
          <p>{searchSummary}</p>
          <small>
            {taskType === 'product_shopping'
              ? 'The retailer links below carry your product keywords. With partner API access configured, matching live listings appear here for comparison.'
              : taskType === 'train_search'
                ? 'No licensed train-search API is connected. The railway site may ask you to re-enter your route and date; ActionDesk will not claim train availability from this handoff.'
                : 'This link opens a web search for your question. Results have not been checked by ActionDesk.'}
          </small>
        </div>
      )}

      {/* Why live search did not run */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs sm:text-sm text-zinc-800 space-y-2">
        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-800 flex-shrink-0" aria-hidden="true" />
          <span>Provider status &amp; policy</span>
        </div>
        <p className="leading-relaxed">{handoffInfo.reason}</p>
        <p className="text-xs text-zinc-600 leading-relaxed">{handoffInfo.termsNotice}</p>
        <p className="text-xs font-medium text-zinc-900 pt-1">
          {handoffInfo.didSearchProvider
            ? `A partner API search was attempted. ActionDesk did not automate the provider website, book, or substitute fabricated results.`
            : `ActionDesk did not search this provider or substitute fabricated results; it offers an official-site handoff.`}
        </p>
      </div>

      {/* Handoff Complete Confirmation Banner */}
      {isHandoffComplete && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-xs sm:text-sm text-emerald-950 flex items-start gap-2.5"
        >
          <CheckCircle2
            className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <strong className="font-semibold block mb-0.5">
              Official provider website opened — you will continue there
            </strong>
            <span>
              ActionDesk handed off your request to the official website. Search, selection, and
              payment take place directly on the provider’s site under your control.
            </span>
          </div>
        </div>
      )}

      {/* Official Website Handoff Controls */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2.5">
          Continue on an official provider
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {handoffInfo.availableHandoffs.map((item) => (
            <div
              key={item.providerId}
              className="bg-white border border-zinc-300 rounded-lg p-3.5 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-900">{item.providerName}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Official handoff
                  </span>
                </div>
                <p className="text-xs text-zinc-600 break-all">{item.officialUrl}</p>
              </div>

              <a
                href={item.handoffUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => onOpenOfficialSite(item.providerId, item.handoffUrl)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition min-h-[38px]"
              >
                <span>
                  {taskType === 'product_shopping'
                    ? `Search ${item.providerName}`
                    : `Open ${item.providerName}`}
                </span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
