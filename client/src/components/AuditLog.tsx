import React from 'react';
import { History, ChevronDown } from 'lucide-react';
import { ActionLogEvent } from '../../../shared/types.js';

interface AuditLogProps {
  events: ActionLogEvent[];
}

export const AuditLog: React.FC<AuditLogProps> = ({ events }) => {
  if (!events || events.length === 0) return null;

  return (
    <details className="surface-card bg-white border border-zinc-300 rounded-xl overflow-hidden mt-4 group">
      <summary className="px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition select-none">
        <span className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-600" aria-hidden="true" />
          <span>Action history ({events.length} steps)</span>
        </span>
        <ChevronDown
          className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="p-4 max-h-64 overflow-y-auto border-t border-zinc-200 bg-zinc-50/70">
        <ol role="list" className="space-y-2 text-xs">
          {events.map((evt) => {
            let badgeStyle = 'bg-zinc-100 text-zinc-700 border-zinc-300';
            if (evt.level === 'success')
              badgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300';
            else if (evt.level === 'warn')
              badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300';
            else if (evt.level === 'error') badgeStyle = 'bg-red-50 text-red-900 border-red-300';

            const time = new Date(evt.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <li
                key={evt.id}
                className="flex flex-wrap sm:flex-nowrap items-start gap-2 leading-relaxed bg-white p-2.5 rounded-lg border border-zinc-200"
              >
                <span className="text-[11px] font-mono text-zinc-600 flex-shrink-0">{time}</span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0 ${badgeStyle}`}
                >
                  {evt.type.replace('_', ' ')}
                </span>
                <span className="text-zinc-800">{evt.message}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
};
