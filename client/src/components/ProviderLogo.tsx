import React from 'react';
import { ProviderDescriptor } from '../../../shared/types.js';

const providerBranding: Record<string, { name: string; asset?: string; fallback: string }> = {
  amazon_in: { name: 'amazon', asset: '/provider-logos/amazon.ico', fallback: 'a' },
  flipkart: { name: 'Flipkart', asset: '/provider-logos/flipkart.png', fallback: 'F' },
  makemytrip: { name: 'MakeMyTrip', asset: '/provider-logos/makemytrip.ico', fallback: 'M' },
  irctc: { name: 'IRCTC', fallback: 'IR' },
  goibibo: { name: 'goibibo', asset: '/provider-logos/goibibo.ico', fallback: 'g' },
};

/** Local copies of official site favicons plus their clear wordmarks. */
export const ProviderLogo: React.FC<{ provider: ProviderDescriptor; compact?: boolean }> = ({
  provider,
  compact = false,
}) => {
  const branding = providerBranding[provider.id] || {
    name: provider.name,
    fallback: provider.name.slice(0, 1),
  };
  return (
    <span
      className={`provider-logo ${compact ? 'provider-logo-compact' : ''} provider-logo-${provider.id}`}
      role="img"
      aria-label={`${provider.name} logo`}
    >
      <span className="provider-logo-symbol">
        <span className="provider-logo-fallback" aria-hidden="true">
          {branding.fallback}
        </span>
        {branding.asset && (
          <img
            src={branding.asset}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
      </span>
      <span className="provider-logo-wordmark" aria-hidden="true">
        {branding.name}
      </span>
    </span>
  );
};
