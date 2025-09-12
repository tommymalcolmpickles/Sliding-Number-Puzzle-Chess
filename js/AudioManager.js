import { SOUND_DELAY } from './Constants.js';

export default class AudioManager {
  constructor() {
    this.audioContext = null;
    this.tapBuffer = null;
    this.slideBuffer = null;
    this.isInitialized = false;
    this.soundEnabled = true;
    this.tapGainNode = null;
    this.slideGainNode = null;
    this.tapVolume = 0.8; // Louder tap sound
    this.slideVolume = 0.3; // Softer slide sound
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

      // Create gain nodes for volume control
      this.tapGainNode = this.audioContext.createGain();
      this.slideGainNode = this.audioContext.createGain();
      this.tapGainNode.gain.value = this.tapVolume;
      this.slideGainNode.gain.value = this.slideVolume;

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
    }
  }

  async playTap() {
    if (!this.soundEnabled) return;

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized || !this.audioContext || !this.tapBuffer || !this.tapGainNode) {
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
          // Create and play the sound with volume control
          const source = this.audioContext.createBufferSource();
          source.buffer = this.tapBuffer;
          source.connect(this.tapGainNode);
          this.tapGainNode.connect(this.audioContext.destination);
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
    if (!this.soundEnabled) return;

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized || !this.audioContext || !this.slideBuffer || !this.slideGainNode) {
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
          // Create and play the sound with volume control
          const source = this.audioContext.createBufferSource();
          source.buffer = this.slideBuffer;
          source.connect(this.slideGainNode);
          this.slideGainNode.connect(this.audioContext.destination);
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

  // Toggle sound on/off
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Set sound enabled state
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  // Get sound enabled state
  getSoundEnabled() {
    return this.soundEnabled;
  }

  // Set tap volume (0.0 to 1.0)
  setTapVolume(volume) {
    this.tapVolume = Math.max(0, Math.min(1, volume));
    if (this.tapGainNode) {
      this.tapGainNode.gain.value = this.tapVolume;
    }
  }

  // Set slide volume (0.0 to 1.0)
  setSlideVolume(volume) {
    this.slideVolume = Math.max(0, Math.min(1, volume));
    if (this.slideGainNode) {
      this.slideGainNode.gain.value = this.slideVolume;
    }
  }

  // Get current volumes
  getVolumes() {
    return {
      tap: this.tapVolume,
      slide: this.slideVolume
    };
  }

}
