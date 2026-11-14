import React from 'react';
import { Check, Train, ShoppingBag, ExternalLink, CheckCircle2, Clock, Info } from 'lucide-react';
import { Recommendation, TrainItinerary, ProductItem } from '../../../shared/types.js';
import { formatTrainPrice, formatProductPrice } from '../utils/format.js';

interface RecommendationCardProps {
  recommendation: Recommendation<TrainItinerary | ProductItem>;
  taskType?: 'train_search' | 'product_shopping' | 'general_info';
  selectedOptionId?: string;
  selectionConfirmed?: boolean;
  onSelectOption: (id: string) => void;
  onConfirmSelection?: () => void;
  disabled?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  taskType,
  selectedOptionId,
  selectionConfirmed,
  onSelectOption,
  onConfirmSelection,
  disabled,
}) => {
  const isTrain = taskType === 'train_search';
  const item = recommendation.selectedItem;
  const activeId = selectedOptionId || item.id;
  const isPrimarySelected = activeId === item.id;
  const sourceLabel = item.providerName || item.sourceLabel || 'Connected provider';
  const sourceUrl = item.sourceUrl || '';

  const primaryTrainPrice = isTrain ? formatTrainPrice(item as TrainItinerary) : null;
  const primaryProductPrice = !isTrain ? formatProductPrice(item as ProductItem) : null;

  const formattedRetrievedAt = item.retrievedAt
    ? new Date(item.retrievedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  if (
    item.dataOrigin !== 'live_provider' ||
    recommendation.alternatives.some((alternative) => alternative.dataOrigin !== 'live_provider')
  )
    return null;

  return (
    <section aria-labelledby="comparison-results-heading" className="mb-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="comparison-results-heading" className="text-base font-semibold text-zinc-900">
            {isTrain ? 'Compare train options' : 'Compare product options'}
          </h2>
          <p className="text-xs text-zinc-600">
            Review the recommended match or pick an alternative below before continuing.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-950 border border-emerald-300">
          <span>Live listing: {item.providerName || sourceLabel}</span>
          {formattedRetrievedAt && (
            <span className="text-[11px] font-normal text-emerald-800">
              · Retrieved {formattedRetrievedAt}
            </span>
          )}
        </span>
      </div>

      {/* Primary Recommendation Card */}
      <article
        aria-label="Recommended option"
        className={`surface-card bg-white rounded-xl p-5 border-2 transition ${
          isPrimarySelected ? 'border-blue-700' : 'border-zinc-300'
        }`}
      >
        {/* Top Row: Badges + Price */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-700 text-white">
              Recommended
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
              Official partner API · {item.providerName}
            </span>
            {isPrimarySelected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Current choice</span>
              </span>
            )}
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-zinc-900">
              {isTrain ? primaryTrainPrice?.totalFormatted : primaryProductPrice}
            </div>
            <div className="text-xs text-zinc-600">
              {isTrain
                ? `${primaryTrainPrice?.perPassengerFormatted} per passenger (provider fare)`
                : 'Provider listed price'}
            </div>
          </div>
        </div>

        {/* Title & Key Specs */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 flex items-center gap-2">
            {isTrain ? (
              <>
                <Train className="w-5 h-5 text-blue-700 flex-shrink-0" aria-hidden="true" />
                <span>
                  {(item as TrainItinerary).carrier} ({(item as TrainItinerary).trainNumber})
                </span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 text-blue-700 flex-shrink-0" aria-hidden="true" />
                <span>{(item as ProductItem).title}</span>
              </>
            )}
          </h3>

          {isTrain ? (
            <div className="mt-1.5 text-xs sm:text-sm text-zinc-700 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                <strong className="font-semibold text-zinc-900">
                  {(item as TrainItinerary).origin}
                </strong>{' '}
                →{' '}
                <strong className="font-semibold text-zinc-900">
                  {(item as TrainItinerary).destination}
                </strong>
              </span>
              <span>•</span>
              <span className="font-medium text-zinc-900">
                {(item as TrainItinerary).departureTime} – {(item as TrainItinerary).arrivalTime}
              </span>
              <span>•</span>
              <span>Duration: {(item as TrainItinerary).duration}</span>
              <span>•</span>
              <span>{(item as TrainItinerary).cabinClass} Class</span>
            </div>
          ) : (
            <div className="mt-1.5 text-xs sm:text-sm text-zinc-700 space-y-1">
              <p>{(item as ProductItem).description}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
                <span>
                  Brand: <strong className="text-zinc-900">{(item as ProductItem).brand}</strong>
                </span>
                <span>•</span>
                {(item as ProductItem).reviewCount > 0 && (
                  <span>
                    Rating:{' '}
                    <strong className="text-zinc-900">{(item as ProductItem).rating} / 5</strong> (
                    {(item as ProductItem).reviewCount.toLocaleString('en-IN')} reviews)
                  </span>
                )}
                {(item as ProductItem).deliveryDays > 0 && (
                  <span>Est. delivery: {(item as ProductItem).deliveryDays} days</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Observed Evidence (Provider-reported / Browser-observed facts) */}
        {item.observedEvidence && item.observedEvidence.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 mb-3">
            <div className="text-xs font-semibold text-zinc-900 mb-1.5">
              Provider-reported details ({item.providerName || 'Connected provider'})
            </div>
            <ul className="space-y-1 text-xs text-zinc-700">
              {item.observedEvidence.map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check
                    className="w-3.5 h-3.5 text-emerald-700 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Uncertainty / Provenance Notice */}
        {item.uncertaintyNote && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-4 flex items-start gap-2 text-xs text-zinc-700">
            <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="font-semibold text-zinc-900">
                Data provenance &amp; accuracy note:{' '}
              </strong>
              <span>{item.uncertaintyNote}</span>
            </div>
          </div>
        )}

        {/* Why Recommended */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 mb-4">
          <div className="text-xs font-semibold text-blue-950 mb-1">
            Why ActionDesk recommends this
          </div>
          <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">
            {recommendation.reason}
          </p>
        </div>

        {/* Reasons & Trade-offs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5">
            <h4 className="text-xs font-semibold text-zinc-900 mb-2">
              Reasons it fits your request
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-700">
              {recommendation.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check
                    className="w-3.5 h-3.5 text-emerald-700 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5">
            <h4 className="text-xs font-semibold text-zinc-900 mb-2">Trade-offs to keep in mind</h4>
            <ul className="space-y-1.5 text-xs text-zinc-700">
              {recommendation.tradeoffs.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-500 font-bold mt-0.5" aria-hidden="true">
                    •
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Source Link, Retrieval Timestamp & Primary Action Footer */}
        <div className="pt-3.5 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-600 flex flex-wrap items-center gap-2">
            <span>
              Source: <strong className="font-medium text-zinc-800">{sourceLabel}</strong>
            </span>
            {formattedRetrievedAt && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-zinc-600">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span>Retrieved {formattedRetrievedAt}</span>
                </span>
              </>
            )}
            <span>·</span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium underline underline-offset-2"
            >
              <span>Open provider listing</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          {!disabled && (
            <div className="flex items-center gap-2">
              {!isPrimarySelected ? (
                <button
                  type="button"
                  onClick={() => onSelectOption(item.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition min-h-[38px]"
                >
                  <span>{isTrain ? 'Choose this train' : 'Choose this product'}</span>
                </button>
              ) : (
                onConfirmSelection && (
                  <button
                    type="button"
                    onClick={onConfirmSelection}
                    disabled={selectionConfirmed}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition min-h-[38px] ${
                      selectionConfirmed
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-default'
                        : 'bg-blue-700 hover:bg-blue-800 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {selectionConfirmed
                        ? `${isTrain ? 'Train' : 'Product'} choice confirmed`
                        : isTrain
                          ? 'Choose this train'
                          : 'Confirm this product'}
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </article>

      {/* Other Matching Options Comparison Grid */}
      {recommendation.alternatives.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Other live provider listings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendation.alternatives.map((alt) => {
              const isSelected = activeId === alt.id;
              const altPriceLabel = isTrain
                ? formatTrainPrice(alt as TrainItinerary).totalFormatted
                : formatProductPrice(alt as ProductItem);
              const altTitle = isTrain
                ? `${(alt as TrainItinerary).carrier} (${(alt as TrainItinerary).trainNumber})`
                : (alt as ProductItem).title;
              const altSourceUrl = alt.sourceUrl || '';

              return (
                <article
                  key={alt.id}
                  className={`surface-card bg-white rounded-xl p-4 border transition flex flex-col justify-between gap-3 ${
                    isSelected ? 'border-2 border-blue-700 bg-blue-50/20' : 'border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-semibold text-zinc-900">{altTitle}</h4>
                      <span className="text-sm font-bold text-zinc-900 flex-shrink-0">
                        {altPriceLabel}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mb-2">
                      {isTrain
                        ? `Departs ${(alt as TrainItinerary).departureTime} · Duration ${(alt as TrainItinerary).duration} · ${(alt as TrainItinerary).cabinClass} Class`
                        : `${(alt as ProductItem).brand} · ${(alt as ProductItem).features.slice(0, 2).join(', ')}`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                      <span className="px-1.5 py-0.5 rounded font-semibold border bg-emerald-50 text-emerald-950 border-emerald-300">
                        {alt.providerName || 'Live provider'}
                      </span>
                      <a
                        href={altSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 underline underline-offset-2"
                      >
                        <span>Source page</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </div>
                  </div>

                  {!disabled && (
                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onSelectOption(alt.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition min-h-[34px] ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                            <span>Selected for checkout</span>
                          </>
                        ) : (
                          <span>{isTrain ? 'Choose this train' : 'Choose this product'}</span>
                        )}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
