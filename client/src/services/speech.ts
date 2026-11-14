/**
 * Browser Speech Recognition & Synthesis Service
 * Provides feature-detected voice input and spoken output with visible mute controls.
 */

// Declare Web Speech API types for TypeScript
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private isMuted = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onStateChangeCallback: ((listening: boolean) => void) | null = null;
  private onErrorCallback: ((message: string) => void) | null = null;

  constructor() {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-IN';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStateChangeCallback?.(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onStateChangeCallback?.(false);
        };

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript && this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        };

        this.recognition.onerror = (err: any) => {
          this.isListening = false;
          this.onStateChangeCallback?.(false);
          this.onErrorCallback?.(this.describeRecognitionError(err?.error));
        };
      } catch (err) {
        this.recognition = null;
      }
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  startListening(
    onResult: (text: string) => void,
    onStateChange?: (listening: boolean) => void,
    onError?: (message: string) => void,
  ): boolean {
    if (!this.recognition) return false;
    this.onResultCallback = onResult;
    this.onStateChangeCallback = onStateChange || null;
    this.onErrorCallback = onError || null;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      this.onErrorCallback?.(
        'Voice input could not start. Close any other active microphone session and try again.',
      );
      return false;
    }
  }

  private describeRecognitionError(code?: string): string {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Microphone access was blocked. Allow microphone access in your browser settings, then try again.';
      case 'no-speech':
        return 'I didn’t hear speech. Try again in a quieter place or type your request instead.';
      case 'audio-capture':
        return 'No microphone was found. Connect a microphone or type your request instead.';
      case 'network':
        return 'The browser speech service could not connect. Check your connection or type your request.';
      case 'aborted':
        return 'Voice input was stopped.';
      default:
        return 'Voice input ended unexpectedly. Try again or type your request.';
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }
    this.isListening = false;
    this.onStateChangeCallback?.(false);
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  speak(text: string, onEnd?: () => void): void {
    if (this.isMuted || !this.isSpeechSynthesisSupported()) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel any active utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Error during speech synthesis:', err);
      onEnd?.();
    }
  }

  stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Error stopping speech synthesis:', err);
      }
    }
  }
}

export const speechService = new SpeechService();
