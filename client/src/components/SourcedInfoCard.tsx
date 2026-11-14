import React from 'react';
import { BookOpen, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { GeneralInfoResult } from '../../../shared/types.js';

interface SourcedInfoCardProps {
  infoResult: GeneralInfoResult;
}

export const SourcedInfoCard: React.FC<SourcedInfoCardProps> = ({ infoResult }) => {
  return (
    <section
      aria-labelledby="sourced-answer-heading"
      className="surface-card bg-white border border-zinc-300 rounded-xl p-5 mb-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2 id="sourced-answer-heading" className="text-base font-semibold text-zinc-900">
            Answer from approved sources
          </h2>
        </div>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
          Approved sources
        </span>
      </div>

      {/* Answer Body */}
      <div className="text-sm text-zinc-800 leading-relaxed space-y-3 mb-5 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
        {infoResult.answer.split('\n\n').map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>

      {/* Citations & Source Links */}
      {infoResult.sources.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2.5">
            Sources used for this answer
          </h3>
          <div className="space-y-2.5">
            {infoResult.sources.map((src, i) => (
              <figure
                key={i}
                className="bg-white border border-zinc-300 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="text-xs space-y-1">
                  <figcaption className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <CheckCircle
                      className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <cite className="not-italic">{src.name}</cite>
                  </figcaption>
                  <blockquote cite={src.url} className="text-xs text-zinc-600 pl-5">
                    “{src.snippet}”
                  </blockquote>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-blue-800 border border-zinc-300 text-xs font-medium transition flex-shrink-0 self-start"
                >
                  <span>Open source</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Unverified Claims Disclaimer */}
      {infoResult.unverifiedClaims && infoResult.unverifiedClaims.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle
            className="w-4 h-4 text-amber-800 mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <div className="font-semibold mb-0.5">Could not verify from approved sources</div>
            {infoResult.unverifiedClaims.map((claim, idx) => (
              <p key={idx} className="text-zinc-800 leading-relaxed">
                {claim}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
