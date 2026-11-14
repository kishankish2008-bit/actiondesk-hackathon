import React, { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Headphones,
  Keyboard,
  Mic,
  Search,
  ShieldCheck,
  ShoppingBag,
  Square,
  TrainFront,
  X,
} from 'lucide-react';

const examples = [
  {
    icon: <Headphones />,
    label: 'Shop on Amazon',
    text: 'Find wireless noise-cancelling headphones under ₹5,000 on Amazon',
  },
  {
    icon: <ShoppingBag />,
    label: 'Compare on Flipkart',
    text: 'Compare wireless USB-C earbuds on Flipkart under ₹4,000',
  },
  { icon: <Keyboard />, label: 'Find a keyboard', text: 'Find a wireless keyboard under ₹3,000' },
  {
    icon: <TrainFront />,
    label: 'Check trains',
    text: 'Find a morning train from Bengaluru to Goa next Friday for 2 passengers',
  },
  {
    icon: <Search />,
    label: 'Look up a policy',
    text: 'What is the luggage allowance and cancellation policy on express trains?',
  },
  { icon: <CalendarDays />, label: 'Start with a question', text: 'Book me a train to Goa.' },
];

interface VoiceListeningOverlayProps {
  listening: boolean;
  error?: string | null;
  onClose: () => void;
  onChooseExample: (text: string) => void;
}

export const VoiceListeningOverlay: React.FC<VoiceListeningOverlayProps> = ({
  listening,
  error,
  onClose,
  onChooseExample,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const choose = (text: string) => {
    onChooseExample(text);
  };

  return (
    <div className="voice-overlay" role="presentation">
      <section
        className="voice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-dialog-title"
        aria-describedby="voice-dialog-help"
      >
        <header className="voice-dialog-header">
          <div className="voice-brand">
            <span className="voice-brand-icon">
              <ArrowUpRight size={17} />
            </span>
            <strong>ActionDesk</strong>
          </div>
          <span className="voice-privacy">
            <ShieldCheck size={14} /> Browser speech recognition
          </span>
          <button
            ref={closeRef}
            type="button"
            className="voice-close"
            onClick={onClose}
            aria-label="Close voice mode"
          >
            <X size={20} />
          </button>
        </header>

        <div className="voice-dialog-content">
          <div className="voice-copy">
            <span className={`voice-live-label ${listening ? '' : 'voice-idle-label'}`}>
              <i />{' '}
              {listening
                ? 'VOICE INPUT ACTIVE'
                : error
                  ? 'MICROPHONE NEEDS ATTENTION'
                  : 'VOICE INPUT PAUSED'}
            </span>
            <h2 id="voice-dialog-title">
              {listening
                ? 'I’m listening…'
                : error
                  ? 'Let’s try another way.'
                  : 'Voice input paused'}
            </h2>
            <p id="voice-dialog-help">
              {listening
                ? 'Speak naturally. I’ll turn your request into a task for you to review.'
                : 'You can retry voice input or choose an example request below.'}
            </p>
          </div>

          <div className="voice-examples voice-examples-left" aria-label="Example requests">
            {examples.slice(0, 3).map((example) => (
              <button type="button" key={example.label} onClick={() => choose(example.text)}>
                <span>{example.icon}</span>
                <span>
                  <strong>{example.label}</strong>
                  <small>{example.text}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="voice-microphone-area">
            <div className={`voice-ring voice-ring-outer ${listening ? 'is-listening' : ''}`} />
            <div className={`voice-ring voice-ring-inner ${listening ? 'is-listening' : ''}`} />
            <div
              className={`voice-wave voice-wave-left ${listening ? 'is-listening' : ''}`}
              aria-hidden="true"
            >
              {Array.from({ length: 11 }, (_, index) => (
                <i key={index} style={{ '--bar-index': index } as React.CSSProperties} />
              ))}
            </div>
            <div className={`voice-mic-orb ${listening ? 'is-listening' : ''}`} aria-hidden="true">
              <Mic size={42} strokeWidth={1.5} />
            </div>
            <div
              className={`voice-wave voice-wave-right ${listening ? 'is-listening' : ''}`}
              aria-hidden="true"
            >
              {Array.from({ length: 11 }, (_, index) => (
                <i key={index} style={{ '--bar-index': index } as React.CSSProperties} />
              ))}
            </div>
            <p className="voice-transcript-hint" role="status" aria-live="polite">
              {listening
                ? 'Say a task, product, route, date, or question.'
                : 'Voice input is paused. Choose an example or close this panel.'}
            </p>
            {error && (
              <p className="voice-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="voice-examples voice-examples-right" aria-label="More example requests">
            {examples.slice(3).map((example) => (
              <button type="button" key={example.label} onClick={() => choose(example.text)}>
                <span>{example.icon}</span>
                <span>
                  <strong>{example.label}</strong>
                  <small>{example.text}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="voice-actions">
            <button
              type="button"
              className="voice-keyboard-action"
              onClick={onClose}
              aria-label="Close voice mode and use the text box"
            >
              <Keyboard size={18} />
              <span>Type instead</span>
            </button>
            <button type="button" className="voice-stop-action" onClick={onClose}>
              {listening ? <Square size={17} fill="currentColor" /> : <X size={17} />}
              <span>{listening ? 'Stop listening' : 'Close voice mode'}</span>
            </button>
            <span className="voice-hint">Choose an example to fill the request box</span>
          </div>
        </div>
        <footer className="voice-dialog-footer">
          Your browser handles speech recognition, and its speech service may process audio. Search
          results appear only when an authorized partner connection is available.
        </footer>
      </section>
    </div>
  );
};
