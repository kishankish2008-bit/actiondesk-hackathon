import React, { useState } from 'react';
import { Volume2, VolumeX, Square, RotateCcw, Plus } from 'lucide-react';
import { speechService } from '../services/speech.js';

interface HeaderProps {
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onNewTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSpeaking, onStopSpeaking, onNewTask }) => {
  const [muted, setMuted] = useState(speechService.getMuted());
  const toggleMute = () => {
    const next = !muted;
    speechService.setMuted(next);
    setMuted(next);
  };
  return (
    <header className="workspace-topbar">
      <a
        href="#main-workspace"
        className="visually-hidden focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>
      <span className="topbar-caption">Your assistant workspace</span>
      <nav aria-label="Workspace controls" className="flex items-center gap-2">
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="topbar-icon-button"
            aria-label="Stop spoken reply"
          >
            <Square size={15} fill="currentColor" />
            <span className="hidden sm:inline">Stop voice</span>
          </button>
        )}
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={!muted}
          className="topbar-icon-button"
          aria-label={muted ? 'Turn spoken replies on' : 'Turn spoken replies off'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="hidden sm:inline">{muted ? 'Voice off' : 'Voice on'}</span>
        </button>
        <button type="button" onClick={onNewTask} className="primary-action">
          <Plus size={17} />
          New task
        </button>
      </nav>
    </header>
  );
};
