import React from 'react';
import { Train, ShoppingBag, BookOpen, HelpCircle, Edit3 } from 'lucide-react';
import { EXAMPLE_PROMPTS } from '../../../shared/constants.js';

interface PromptChipsProps {
  onFillPrompt: (text: string) => void;
  disabled?: boolean;
  variant?: 'cards' | 'compact';
}

export const PromptChips: React.FC<PromptChipsProps> = ({
  onFillPrompt,
  disabled,
  variant = 'cards',
}) => {
  const icon = (category: string) => {
    const cls = 'w-4 h-4 text-zinc-700';
    if (category === 'train') return <Train className={cls} aria-hidden="true" />;
    if (category === 'shop') return <ShoppingBag className={cls} aria-hidden="true" />;
    if (category === 'info') return <BookOpen className={cls} aria-hidden="true" />;
    return <HelpCircle className={cls} aria-hidden="true" />;
  };
  if (variant === 'compact')
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-600 mr-1">Example request:</span>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            disabled={disabled}
            onClick={() => onFillPrompt(prompt.text)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 disabled:opacity-50 min-h-[34px]"
          >
            {icon(prompt.category)}
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>
    );
  return (
    <section aria-labelledby="example-requests-heading" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2
          id="example-requests-heading"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-600"
        >
          Example requests
        </h2>
        <span className="text-xs text-zinc-600">Fill the composer to try one</span>
      </div>
      <ul role="list" className="divide-y divide-zinc-300 border-y border-zinc-300">
        {EXAMPLE_PROMPTS.map((prompt, idx) => (
          <li
            key={prompt.label}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="mt-0.5 text-xs font-mono text-zinc-500">0{idx + 1}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{prompt.label}</p>
                <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">{prompt.summary}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFillPrompt(prompt.text)}
              className="inline-flex items-center gap-1.5 py-1 text-zinc-800 border-b border-zinc-400 hover:border-zinc-900 text-xs font-medium min-h-[34px] disabled:opacity-50"
            >
              {icon(prompt.category)}
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Fill in composer</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
