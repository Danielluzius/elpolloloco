/**
 * SoundHub: central audio manager for music, sfx and UI.
 * - Simple HTMLAudio-based implementation (no external deps)
 * - Gracefully no-ops if files are missing
 * - Persists mute in localStorage (key: sound.muted)
 *
 * Global access: window.SoundHub, window.sound (singleton)
 */
(function () {
  /**
   * Singleton class for managing audio playback, including music, sound effects, and UI sounds.
   */
  class SoundHub {
    static _instance = null;

    /**
     * Retrieves the singleton instance of SoundHub.
     * @returns {SoundHub} The singleton instance.
     */
    static get() {
      if (!SoundHub._instance) SoundHub._instance = new SoundHub();
      return SoundHub._instance;
    }

    constructor() {
      this.muted = false;
      this.master = 1.0;
      this.channels = {
        music: { gain: 1.0, current: null },
        sfx: { gain: 1.0 },
        ui: { gain: 1.0 },
      };
      this.library = new Map();
      this.active = new Set();

      try {
        const m = localStorage.getItem('sound.muted');
        if (m === 'true') this.muted = true;
      } catch (_) {}

      this._registerDefaults();
      this.preloadAll({ shallow: true });
    }

    /**
     * Registers default sound files to the library.
     * @private
     */
    _registerDefaults() {
      const map = {
        intro_music: 'sounds/intro_music.mp3',
        level_start_music: 'sounds/level_start_music.mp3',
        player_lost_music: 'sounds/player_lost_music.mp3',
        endboss_background_music: 'sounds/endboss_background_music.mp3',
        player_won_music: 'sounds/player_won_music.mp3',
        attack_sound: 'sounds/attack_sound.mp3',
        jump_sound: 'sounds/jump_sound.mp3',
        player_dead_sound: 'sounds/player_dead_sound.mp3',
        player_hurt_sound: 'sounds/player_hurt_sound.mp3',
        special_attack_sound: 'sounds/special_attack_sound.mp3',

        goblin_hurt_sound: 'sounds/goblin_hurt_sound.mp3',
        goblin_dead_sound: 'sounds/goblin_dead_sound.mp3',
        endboss_appierce_sound: 'sounds/endboss_appierce_sound.mp3',
        // Note: file is named enboss_hurt_sound.mp3 in /sounds (missing 'd')
        endboss_hurt_sound: 'sounds/enboss_hurt_sound.mp3',
        endboss_dead_sound: 'sounds/endboss_dead_sound.mp3',
      };
      Object.entries(map).forEach(([k, url]) => this.add(k, url));
    }

    /**
     * Adds a sound file to the library.
     * @param {string} key - The unique key for the sound.
     * @param {string} url - The URL of the sound file.
     */
    add(key, url) {
      if (!key || !url) return;
      if (this.library.has(key)) return;
      const a = new Audio();
      a.preload = 'auto';
      a.src = url;
      this.library.set(key, { url, baseAudio: a });
    }

    /**
     * Mutes or unmutes all sounds.
     * @param {boolean} m - True to mute, false to unmute.
     */
    setMuted(m) {
      this.muted = !!m;
      try {
        localStorage.setItem('sound.muted', String(this.muted));
      } catch (_) {}
      if (this.muted) {
        this.stopChannel('sfx');
        this.stopChannel('ui');
        const cur = this.channels.music.current;
        if (cur) {
          try {
            cur.pause();
            cur.currentTime = 0;
          } catch (_) {}
        }
      } else {
        const cur = this.channels.music.current;
        if (cur) this._safePlay(cur);
      }
    }

    /**
     * Toggles the mute state.
     * @returns {boolean} The new mute state.
     */
    toggleMuted() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    /**
     * Checks if the sound is muted.
     * @returns {boolean} True if muted, false otherwise.
     */
    isMuted() {
      return !!this.muted;
    }

    /**
     * Sets the volume for a specific channel or the master volume.
     * @param {string} channel - The channel name ('master', 'music', 'sfx', 'ui').
     * @param {number} value - The volume level (0.0 to 1.0).
     */
    setVolume(channel, value) {
      if (channel === 'master') {
        this.master = Math.max(0, Math.min(1, value));
        return;
      }
      const ch = this.channels[channel];
      if (ch) ch.gain = Math.max(0, Math.min(1, value));
      if (channel === 'music' && this.channels.music.current) {
        this.channels.music.current.volume = this._mixVolume(1, 'music');
      }
    }

    /**
     * Preloads all sound files in the library.
     * @param {Object} options - Options for preloading.
     * @param {boolean} options.shallow - If true, only prepares the audio elements without loading.
     */
    preloadAll({ shallow = false } = {}) {
      this.library.forEach(({ baseAudio }) => {
        try {
          if (!shallow) baseAudio.load();
        } catch (_) {}
      });
    }

    /**
     * Plays a music track.
     * @param {string} key - The key of the music track.
     * @param {Object} options - Playback options.
     * @param {number} options.volume - The volume level (0.0 to 1.0).
     * @param {boolean} options.loop - Whether the track should loop.
     */
    playMusic(key, { volume = 1.0, loop = true } = {}) {
      const item = this.library.get(key);
      if (!item) return;
      this.stopChannel('music');
      const a = item.baseAudio.cloneNode(true);
      a.loop = loop;
      a.volume = this._mixVolume(volume, 'music');
      this.channels.music.current = a;
      if (!this.muted) this._safePlay(a);
    }

    /**
     * Stops the currently playing music.
     */
    stopMusic() {
      this.stopChannel('music');
    }

    /**
     * Plays a sound effect or UI sound.
     * @param {string} key - The key of the sound.
     * @param {Object} options - Playback options.
     * @param {string} options.channel - The channel to play the sound on ('sfx', 'ui').
     * @param {number} options.volume - The volume level (0.0 to 1.0).
     * @param {boolean} options.loop - Whether the sound should loop.
     * @param {boolean} options.allowOverlap - Whether overlapping playback is allowed.
     */
    play(
      key,
      { channel = 'sfx', volume = 1.0, loop = false, allowOverlap = true } = {}
    ) {
      const item = this.library.get(key);
      if (!item) return;
      const ch = this.channels[channel] ? channel : 'sfx';
      if (this.muted) return;
      const node = allowOverlap
        ? item.baseAudio.cloneNode(true)
        : item.baseAudio;
      node.loop = !!loop;
      node.volume = this._mixVolume(volume, ch);
      this.active.add(node);
      node.addEventListener('ended', () => this.active.delete(node), {
        once: true,
      });
      node.addEventListener('pause', () => this._gcNode(node));
      this._safePlay(node);
    }

    /**
     * Stops all sounds on a specific channel.
     * @param {string} channel - The channel to stop ('music', 'sfx', 'ui').
     */
    stopChannel(channel) {
      if (channel === 'music') {
        const cur = this.channels.music.current;
        if (cur) {
          try {
            cur.pause();
            cur.currentTime = 0;
          } catch (_) {}
          this.channels.music.current = null;
        }
        return;
      }
      this.active.forEach((node) => {
        try {
          node.pause();
          node.currentTime = 0;
        } catch (_) {}
      });
      this.active.clear();
    }

    /**
     * Stops all sounds on all channels.
     */
    stopAll() {
      this.stopChannel('music');
      this.stopChannel('sfx');
      this.stopChannel('ui');
    }

    /**
     * Fades the music volume to a target level over a specified duration.
     * @param {number} target - The target volume level (0.0 to 1.0).
     * @param {number} ms - The duration of the fade in milliseconds.
     */
    fadeMusicTo(target = 0, ms = 400) {
      const cur = this.channels.music.current;
      if (!cur) return;
      target = Math.max(0, Math.min(1, target));
      const start = cur.volume;
      const end = this._mixVolume(target, 'music');
      if (Math.abs(start - end) < 0.01) return;
      const steps = Math.max(1, Math.floor(ms / 16));
      let i = 0;
      const id = setInterval(() => {
        i++;
        const t = i / steps;
        cur.volume = start + (end - start) * t;
        if (i >= steps) clearInterval(id);
      }, 16);
    }

    /**
     * Calculates the effective volume for a channel.
     * @param {number} v - The base volume level.
     * @param {string} channel - The channel name.
     * @returns {number} The effective volume level.
     * @private
     */
    _mixVolume(v, channel) {
      const ch = this.channels[channel] || { gain: 1 };
      return Math.max(0, Math.min(1, v * ch.gain * this.master));
    }

    /**
     * Safely plays an audio element.
     * @param {HTMLAudioElement} audio - The audio element to play.
     * @private
     */
    _safePlay(audio) {
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) {}
    }

    /**
     * Garbage collects an audio node if it is no longer active.
     * @param {HTMLAudioElement} node - The audio node to check.
     * @private
     */
    _gcNode(node) {
      if (node.ended || node.currentTime === 0) this.active.delete(node);
    }
  }

  if (typeof window !== 'undefined') {
    window.SoundHub = SoundHub;
    if (!window.sound) window.sound = SoundHub.get();
    try {
      window.isMuted = SoundHub.get().isMuted();
    } catch (_) {}
  }
})();
