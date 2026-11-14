import React, { FormEvent, useEffect, useState } from 'react';
import {
  AudioLines,
  ArrowRight,
  Bot,
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { askAssistant, getAssistantStatus } from '../services/api.js';

const taskSuggestions = [
  {
    title: 'Find a product',
    prompt: 'Find wireless noise-cancelling headphones under ₹5,000 on Amazon',
  },
  {
    title: 'Plan a train search',
    prompt: 'Find a morning train from Bengaluru to Goa next Friday for 2 passengers',
  },
  {
    title: 'Ask about a policy',
    prompt: 'What is the luggage allowance and cancellation policy on express trains?',
  },
];

interface DeskBuddyProps {
  onSelectPrompt: (prompt: string) => void;
  onStartVoice: () => void;
}

export const DeskBuddy: React.FC<DeskBuddyProps> = ({ onSelectPrompt, onStartVoice }) => {
  const [open, setOpen] = useState(false);
  const [geminiReady, setGeminiReady] = useState<boolean | null>(null);
  const [model, setModel] = useState('Gemini');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || geminiReady !== null) return;
    getAssistantStatus()
      .then((status) => {
        setGeminiReady(status.configured);
        setModel(status.model);
      })
      .catch(() => {
        setGeminiReady(false);
        setError('Could not reach the local assistant service.');
      });
  }, [open, geminiReady]);

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = question.trim();
    if (!message || busy) return;
    setBusy(true);
    setError('');
    setAnswer('');
    try {
      setAnswer(await askAssistant(message));
      setQuestion('');
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : 'The assistant could not answer right now.',
      );
    } finally {
      setBusy(false);
    }
  };

  const choosePrompt = (prompt: string) => {
    setOpen(false);
    onSelectPrompt(prompt);
  };

  return (
    <div className="desk-buddy-dock">
      {open && (
        <section
          className="desk-buddy-panel"
          aria-label="Desk Buddy assistant"
          role="dialog"
          aria-modal="false"
          aria-labelledby="desk-buddy-title"
        >
          <header className="desk-buddy-panel-header">
            <span className="desk-buddy-panel-avatar">
              <Bot size={18} />
            </span>
            <div>
              <h2 id="desk-buddy-title">Desk Buddy</h2>
              <p>{geminiReady ? `${model} request helper` : 'Task tips and examples'}</p>
            </div>
            <button
              type="button"
              className="desk-buddy-close"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </header>
          <div className="desk-buddy-panel-body">
            <p className="desk-buddy-intro">
              Tell me what you’re trying to do. I can help shape a clear request; you stay in
              control of provider pages and checkout.
            </p>
            <div className="desk-buddy-suggestions" aria-label="Start with a request">
              {taskSuggestions.map((item) => (
                <button type="button" key={item.title} onClick={() => choosePrompt(item.prompt)}>
                  <span>{item.title}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <div className="desk-buddy-reply" aria-live="polite">
              {answer && (
                <>
                  <strong>Desk Buddy</strong>
                  <p>{answer}</p>
                </>
              )}
              {error && (
                <p className="desk-buddy-error" role="alert">
                  {error}
                </p>
              )}
              {geminiReady === false && !error && (
                <p className="desk-buddy-muted">
                  Gemini isn’t connected yet. Add <code>GEMINI_API_KEY</code> to the server’s local{' '}
                  <code>.env</code> file to enable tailored replies. The examples above work without
                  it.
                </p>
              )}
              {geminiReady && !answer && !error && (
                <p className="desk-buddy-muted">
                  Ask me how to phrase a request or use the examples above. I don’t provide live
                  search results here.
                </p>
              )}
            </div>
            <form className="desk-buddy-form" onSubmit={submitQuestion}>
              <label className="visually-hidden" htmlFor="desk-buddy-question">
                Ask Desk Buddy
              </label>
              <input
                id="desk-buddy-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask how to make a clear request…"
                maxLength={1000}
                disabled={!geminiReady || busy}
              />
              <button
                type="submit"
                aria-label="Send question to Desk Buddy"
                disabled={!geminiReady || busy || !question.trim()}
              >
                {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={16} />}
              </button>
            </form>
            <p className="desk-buddy-disclosure">
              Gemini helps phrase requests. It does not verify current prices, availability, or
              policies. Message text is sent to Google when enabled.
            </p>
          </div>
        </section>
      )}

      <div className="desk-buddy-character-wrap">
        <span className="desk-buddy-tip" aria-hidden="true">
          Need a hand?
        </span>
        <button
          type="button"
          className={`desk-buddy-character ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Close Desk Buddy assistant' : 'Open Desk Buddy assistant'}
        >
          <svg
            viewBox="0 0 82 94"
            role="img"
            aria-label="A small animated green and cream robot assistant"
          >
            <ellipse cx="42" cy="88" rx="24" ry="4" className="buddy-shadow" />
            <path d="M30 70 26 84h11l5-12m10-2 7 14H48l-5-12" className="buddy-legs" />
            <path d="m25 51-8 9 6 13 11-7m24-15 8 9-5 13-12-7" className="buddy-arms" />
            <rect x="24" y="47" width="37" height="29" rx="12" className="buddy-body" />
            <path d="M33 48v-5m19 5v-5" className="buddy-neck" />
            <rect x="18" y="13" width="50" height="39" rx="16" className="buddy-head" />
            <rect x="23" y="19" width="40" height="27" rx="11" className="buddy-screen" />
            <g className="buddy-eyes">
              <ellipse cx="34" cy="31" rx="3.5" ry="4.7" />
              <ellipse cx="51" cy="31" rx="3.5" ry="4.7" />
            </g>
            <path d="M35 39q7 5 14 0" className="buddy-smile" />
            <path d="M15 27h3m50 0h3" className="buddy-antenna" />
            <circle cx="41" cy="9" r="3" className="buddy-sensor" />
            <path d="M31 59h23" className="buddy-chest-line" />
            <circle cx="42" cy="66" r="3" className="buddy-chest-dot" />
          </svg>
        </button>
      </div>

      <div className="desk-buddy-toolbar" role="group" aria-label="Assistant shortcuts">
        <button
          type="button"
          aria-label="Open Desk Buddy chat"
          title="Open Desk Buddy"
          onClick={() => setOpen((value) => !value)}
        >
          <MessageCircle size={16} />
        </button>
        <span className="desk-buddy-toolbar-divider" aria-hidden="true" />
        <button
          type="button"
          aria-label="Start voice request"
          title="Start voice request"
          onClick={onStartVoice}
        >
          <AudioLines size={17} />
        </button>
        <span className="desk-buddy-toolbar-divider" aria-hidden="true" />
        <button
          type="button"
          aria-label={open ? 'Minimize assistant' : 'Open assistant'}
          title={open ? 'Minimize assistant' : 'Open assistant'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <ChevronDown size={17} />
          ) : (
            <ArrowRight size={16} className="desk-buddy-toolbar-up" />
          )}
        </button>
      </div>
    </div>
  );
};
