import { SOUND_DELAY } from './Constants.js';

export default class AudioManager {
  constructor() {
    this.audioContext = null;
    this.tapBuffer = null;
    this.slideBuffer = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Load both audio files in parallel
      const [tapResponse, slideResponse] = await Promise.all([
        fetch('./js/tap.wav'),
        fetch('./js/slide.wav')
      ]);

      if (!tapResponse.ok || !slideResponse.ok) {
        throw new Error(`HTTP error! tap: ${tapResponse.status}, slide: ${slideResponse.status}`);
      }

      const [tapArrayBuffer, slideArrayBuffer] = await Promise.all([
        tapResponse.arrayBuffer(),
        slideResponse.arrayBuffer()
      ]);

      [this.tapBuffer, this.slideBuffer] = await Promise.all([
        this.audioContext.decodeAudioData(tapArrayBuffer.slice()),
        this.audioContext.decodeAudioData(slideArrayBuffer.slice())
      ]);

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
    }
  }

  async playTap() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized || !this.audioContext || !this.tapBuffer) {
      return;
    }

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Apply sound delay - negative values play immediately
      const delay = Math.max(0, SOUND_DELAY);

      setTimeout(() => {
        try {
          // Create and play the sound
          const source = this.audioContext.createBufferSource();
          source.buffer = this.tapBuffer;
          source.connect(this.audioContext.destination);
          source.start(0);
        } catch (playError) {
          // Failed to play tap sound
        }
      }, delay);
    } catch (error) {
      // Try to reinitialize on next play attempt
      this.isInitialized = false;
    }
  }

  async playSlide() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized || !this.audioContext || !this.slideBuffer) {
      return;
    }

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Apply sound delay - negative values play immediately
      const delay = Math.max(0, SOUND_DELAY);

      setTimeout(() => {
        try {
          // Create and play the sound
          const source = this.audioContext.createBufferSource();
          source.buffer = this.slideBuffer;
          source.connect(this.audioContext.destination);
          source.start(0);
        } catch (playError) {
          // Failed to play slide sound
        }
      }, delay);
    } catch (error) {
      // Try to reinitialize on next play attempt
      this.isInitialized = false;
    }
  }

}
