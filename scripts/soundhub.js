/**
 * SoundHub: central audio manager for music, sfx and UI.
 * - Simple HTMLAudio-based implementation (no external deps)
 * - Gracefully no-ops if files are missing
 * - Persists mute in localStorage (key: sound.muted)
 *
 * Global access: window.SoundHub, window.sound (singleton)
 */
(function () {
  class SoundHub {
    static _instance = null;

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

    add(key, url) {
      if (!key || !url) return;
      if (this.library.has(key)) return;
      const a = new Audio();
      a.preload = 'auto';
      a.src = url;
      this.library.set(key, { url, baseAudio: a });
    }

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

    toggleMuted() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    isMuted() {
      return !!this.muted;
    }

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

    preloadAll({ shallow = false } = {}) {
      this.library.forEach(({ baseAudio }) => {
        try {
          if (!shallow) baseAudio.load();
        } catch (_) {}
      });
    }

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

    stopMusic() {
      this.stopChannel('music');
    }

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

    stopAll() {
      this.stopChannel('music');
      this.stopChannel('sfx');
      this.stopChannel('ui');
    }

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

    _mixVolume(v, channel) {
      const ch = this.channels[channel] || { gain: 1 };
      return Math.max(0, Math.min(1, v * ch.gain * this.master));
    }

    _safePlay(audio) {
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) {}
    }

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
