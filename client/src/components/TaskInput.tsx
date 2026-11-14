import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowUp, Loader2 } from 'lucide-react';
import { speechService } from '../services/speech.js';
import { VoiceListeningOverlay } from './VoiceListeningOverlay.js';

interface TaskInputProps {
  onSubmit: (text: string, mode: 'text' | 'voice') => void;
  isLoading: boolean;
  compact?: boolean;
  draftText?: string;
  onDraftConsumed?: () => void;
  startVoiceOnMount?: boolean;
  onVoiceModeOpened?: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onSubmit,
  isLoading,
  compact = false,
  draftText,
  onDraftConsumed,
  startVoiceOnMount = false,
  onVoiceModeOpened,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechSupported = speechService.isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      speechService.stopListening();
    };
  }, []);

  // Populate composer when an example prompt is clicked without auto-submitting
  useEffect(() => {
    if (draftText !== undefined && draftText.length > 0) {
      setText(draftText);
      textareaRef.current?.focus();
      onDraftConsumed?.();
    }
  }, [draftText, onDraftConsumed]);

  const handleToggleListening = () => {
    if (isListening) {
      closeVoiceMode();
    } else {
      setVoiceError(null);
      setVoiceOpen(true);
      const started = speechService.startListening(
        (transcript) => {
          setText(transcript);
          setIsListening(false);
          setVoiceOpen(false);
          if (transcript.trim().length > 0) {
            onSubmit(transcript, 'voice');
          }
        },
        (listeningState) => {
          setIsListening(listeningState);
        },
        (message) => setVoiceError(message),
      );
      if (!started) {
        setIsListening(false);
        setVoiceError(
          'Could not start voice input. Check your browser microphone permission and try again.',
        );
      }
    }
  };

  const closeVoiceMode = () => {
    speechService.stopListening();
    setIsListening(false);
    setVoiceOpen(false);
    setVoiceError(null);
  };

  const chooseVoiceExample = (example: string) => {
    closeVoiceMode();
    setText(example);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  useEffect(() => {
    if (!startVoiceOnMount) return;
    onVoiceModeOpened?.();
    handleToggleListening();
  }, [startVoiceOnMount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSubmit(text.trim(), 'text');
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // IME-safe enter submission check
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      if (text.trim() && !isLoading && !isListening) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const inputId = compact ? 'actiondesk-composer-compact' : 'actiondesk-composer-input';
  const hintId = compact ? 'composer-hint-compact' : 'composer-hint';

  return (
    <>
      <search aria-label="Task request composer" className="w-full">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`surface-card bg-white border rounded-xl transition ${
            isListening
              ? 'border-red-600 ring-2 ring-red-100'
              : 'border-zinc-300 focus-within:border-blue-700'
          } ${compact ? 'p-3' : 'p-4 shadow-sm'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label
              htmlFor={inputId}
              className={`block font-medium text-zinc-800 ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {compact
                ? 'Ask another question or start a new task'
                : 'What would you like ActionDesk to do?'}
            </label>

            <span className="text-xs font-medium text-zinc-600">
              Partner API search · Official-site handoff
            </span>
          </div>

          <textarea
            ref={textareaRef}
            id={inputId}
            name="prompt"
            rows={compact ? 2 : 3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isListening}
            aria-describedby={hintId}
            maxLength={2000}
            placeholder={
              isListening
                ? 'Listening… Speak your request clearly.'
                : 'e.g., Find noise-cancelling headphones under ₹5,000 on Amazon, or Find a morning train from Bengaluru to Goa on 24 May'
            }
            className="w-full resize-y bg-transparent text-base text-zinc-900 placeholder:text-zinc-500 border-0 p-0 focus:outline-none leading-relaxed min-h-[52px]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-zinc-200">
            <div id={hintId} className="text-xs text-zinc-600 flex items-center gap-2">
              {isListening ? (
                <span
                  className="text-red-700 font-semibold flex items-center gap-1.5"
                  role="status"
                >
                  <span
                    className="h-2 w-2 rounded-full bg-red-600 animate-pulse"
                    aria-hidden="true"
                  />
                  Listening for voice input…
                </span>
              ) : (
                <span>
                  Gemini may interpret your request when configured; never include passwords or
                  payment details.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Separate Voice Input Control */}
              {speechSupported ? (
                <button
                  type="button"
                  onClick={handleToggleListening}
                  disabled={isLoading}
                  aria-pressed={isListening}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition min-h-[40px] ${
                    isListening
                      ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
                  } disabled:opacity-50`}
                >
                  <Mic className="w-4 h-4" aria-hidden="true" />
                  <span>{isListening ? 'Stop listening' : 'Voice input'}</span>
                </button>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-zinc-600 bg-zinc-100 border border-zinc-200"
                  role="note"
                >
                  <MicOff className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Voice unavailable (text active)</span>
                </span>
              )}

              {/* Primary Send Button */}
              <button
                type="submit"
                disabled={!text.trim() || isLoading || isListening}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Searching…</span>
                  </>
                ) : (
                  <>
                    <span>Send request</span>
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </search>
      {voiceOpen && (
        <VoiceListeningOverlay
          listening={isListening}
          error={voiceError}
          onClose={closeVoiceMode}
          onChooseExample={chooseVoiceExample}
        />
      )}
    </>
  );
};
