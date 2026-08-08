// Browser Web Speech API & Speech Delivery Analytics Service

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.startTime = null;
    this.wordCount = 0;
    this.onTranscriptUpdate = null;
    this.onStateChange = null;

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        this.transcript = currentTranscript;
        this.wordCount = currentTranscript.trim() ? currentTranscript.trim().split(/\s+/).length : 0;
        
        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate(this.transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            this.isListening = false;
            if (this.onStateChange) this.onStateChange(false);
          }
        }
      };
    }
  }

  isSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  startListening(onTranscriptUpdate, onStateChange) {
    if (!this.isSupported()) {
      throw new Error('Speech Recognition is not supported in this browser. Switching to Text mode.');
    }

    this.transcript = '';
    this.wordCount = 0;
    this.startTime = Date.now();
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onStateChange = onStateChange;

    try {
      this.recognition.start();
      this.isListening = true;
      if (this.onStateChange) this.onStateChange(true);
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      this.isListening = false;
      if (this.onStateChange) this.onStateChange(false);
      throw e;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (e) {
        console.error(e);
      }
      if (this.onStateChange) this.onStateChange(false);
    }

    const durationSeconds = this.startTime ? Math.round((Date.now() - this.startTime) / 1000) : 0;
    return this.analyzeSpeechMetrics(this.transcript, durationSeconds);
  }

  analyzeSpeechMetrics(transcriptText = '', durationSeconds = 0) {
    const text = transcriptText.trim().toLowerCase();
    const words = text ? text.split(/\s+/) : [];
    const totalWords = words.length;

    // Speaking pace (WPM)
    const minutes = Math.max(0.1, durationSeconds / 60);
    const wpm = Math.round(totalWords / minutes);

    // Common filler words list
    const fillerWordsList = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so yeah', 'right'];
    let fillerCount = 0;

    fillerWordsList.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        fillerCount += matches.length;
      }
    });

    // Delivery Feedback
    let paceFeedback = 'Optimal Pace (120–150 WPM)';
    if (wpm < 90) paceFeedback = 'Pace too slow (<90 WPM). Speak a bit faster.';
    else if (wpm > 170) paceFeedback = 'Pace too fast (>170 WPM). Pause for clarity.';

    let fillerFeedback = 'Low filler frequency';
    if (fillerCount >= 5) fillerFeedback = 'High filler word frequency. Practice pausing silently.';

    return {
      transcript: transcriptText,
      wordCount: totalWords,
      durationSeconds,
      wpm,
      fillerCount,
      paceFeedback,
      fillerFeedback
    };
  }
}

export const speechService = new SpeechService();
