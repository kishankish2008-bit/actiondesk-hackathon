import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertTriangle, MinusCircle } from 'lucide-react';
import { PlanStep, TaskStatus } from '../../../shared/types.js';
import { getPlainStatusLabel } from '../utils/format.js';

interface PlanTrackerProps {
  plan: PlanStep[];
  status?: TaskStatus;
}

export const PlanTracker: React.FC<PlanTrackerProps> = ({ plan, status }) => {
  if (!plan || plan.length === 0) return null;

  const completedCount = plan.filter((s) => s.status === 'completed').length;
  const statusInfo = status ? getPlainStatusLabel(status) : null;

  return (
    <section
      aria-labelledby="task-progress-heading"
      className="surface-card bg-white border border-zinc-300 rounded-xl p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-200">
        <div>
          <h2 id="task-progress-heading" className="text-sm font-semibold text-zinc-900">
            Task progress
          </h2>
          {statusInfo && <p className="text-xs text-zinc-600 mt-0.5">{statusInfo.label}</p>}
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
          {completedCount} of {plan.length} steps done
        </span>
      </div>

      <ol role="list" className="space-y-2.5">
        {plan.map((step, idx) => {
          const isCurrent = step.status === 'in_progress';
          let icon = <Circle className="w-4 h-4 text-zinc-500" aria-hidden="true" />;
          let stepLabel = 'Up next';
          let badgeClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
          let rowClass = 'border-zinc-200 bg-zinc-50/60 text-zinc-700';

          if (step.status === 'completed') {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />;
            stepLabel = 'Done';
            badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            rowClass = 'border-zinc-200 bg-white text-zinc-900';
          } else if (step.status === 'in_progress') {
            icon = <Loader2 className="w-4 h-4 text-blue-700 animate-spin" aria-hidden="true" />;
            stepLabel = 'Current step';
            badgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
            rowClass = 'border-blue-600 bg-blue-50/50 text-zinc-900 font-medium';
          } else if (step.status === 'failed') {
            icon = <AlertTriangle className="w-4 h-4 text-red-700" aria-hidden="true" />;
            stepLabel = 'Stopped';
            badgeClass = 'bg-red-50 text-red-800 border-red-200';
            rowClass = 'border-red-300 bg-red-50/40 text-red-900';
          } else if (step.status === 'skipped') {
            icon = <MinusCircle className="w-4 h-4 text-zinc-500" aria-hidden="true" />;
            stepLabel = 'Skipped';
            badgeClass = 'bg-zinc-100 text-zinc-600 border-zinc-200';
            rowClass = 'border-zinc-200 bg-zinc-50 text-zinc-500 line-through';
          }

          return (
            <li
              key={step.id || idx}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-xs transition ${rowClass}`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 flex-shrink-0">{icon}</span>
                <div className="min-w-0 leading-relaxed">
                  <div>
                    <span className="font-semibold mr-1">{idx + 1}.</span>
                    <span>{step.title}</span>
                  </div>
                  {step.detail && (
                    <p className="text-[11px] text-zinc-600 mt-0.5 font-normal">{step.detail}</p>
                  )}
                </div>
              </div>

              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded border flex-shrink-0 ${badgeClass}`}
              >
                {stepLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
