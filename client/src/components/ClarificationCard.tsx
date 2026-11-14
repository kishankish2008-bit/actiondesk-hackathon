import React, { useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface ClarificationCardProps {
  prompt: string;
  missingFields?: string[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  prompt,
  missingFields = [],
  onSubmit,
  isLoading,
}) => {
  const [response, setResponse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() || isLoading) return;
    onSubmit({ userClarification: response.trim() });
    setResponse('');
  };

  return (
    <section
      aria-labelledby="clarification-heading"
      className="surface-card bg-amber-50/70 border border-amber-300 rounded-xl p-5 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-900 mt-0.5 flex-shrink-0">
          <HelpCircle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 id="clarification-heading" className="text-sm font-semibold text-amber-950">
              One quick detail needed
            </h2>
            {missingFields.map((f, i) => (
              <span
                key={i}
                className="text-xs font-medium bg-white text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md"
              >
                Missing: {f}
              </span>
            ))}
          </div>

          <p id="clarification-prompt-text" className="text-sm text-zinc-800 mb-4 leading-relaxed">
            {prompt}
          </p>

          <form onSubmit={handleSubmit} className="space-y-2">
            <label
              htmlFor="clarification-response-input"
              className="block text-xs font-medium text-zinc-800"
            >
              Your reply
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="clarification-response-input"
                name="clarification"
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                aria-describedby="clarification-prompt-text"
                placeholder="e.g., Departing from Bengaluru on 24 May morning for 2 passengers"
                className="flex-1 bg-white border border-zinc-400 focus:border-blue-700 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 min-h-[42px]"
              />
              <button
                type="submit"
                disabled={!response.trim() || isLoading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition min-h-[42px] disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
