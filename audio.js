/* ================================================================
   JX AUDIO ENGINE — 5A
   Web Audio API · Zero audio files · All synthesised
   Okezie Ferdinand | jxdesigndev.com — "The Awakening" 2089
   ================================================================
   Public API (on window.JXAudio):
     .enable()                   — unmute + resume context
     .disable()                  — mute + suspend context
     .toggle()                   — flip state
     .drone(scrollProgress)      — call each scroll tick (0..1)
     .morphWhisper()             — 0.3s bandpass noise burst
     .sculptPing(force)          — resonant sine ping (force 0..1)
     .hoverTick()                — brief click tick
   ================================================================ */

(function () {
  'use strict';

  /* ── Constants ── */
  const DRONE_FREQ      = 50;       // Hz  — deep subwoofer rumble
  const DRONE_MAX_GAIN  = 0.18;     // amplitude ceiling
  const WHISPER_FREQ_LO = 200;      // bandpass low  (Hz)
  const WHISPER_FREQ_HI = 2000;     // bandpass high (Hz)
  const WHISPER_DECAY   = 0.3;      // seconds
  const PING_FREQ       = 220;      // Hz  — A3 sine
  const PING_MAX_GAIN   = 0.25;
  const TICK_FREQ       = 1200;     // Hz  — short hover click
  const TICK_DUR        = 0.04;     // seconds

  /* ── State ── */
  let _ctx         = null;   // AudioContext — lazy-created
  let _masterGain  = null;   // master gain node (0 = muted, 1 = live)
  let _droneOsc    = null;   // persistent oscillator for drone
  let _droneGain   = null;   // drone envelope gain
  let _enabled     = false;  // user opted in?
  let _toastShown  = false;  // first-interaction toast shown?

  /* ─────────────────────────────────────────────────────────────
     PRIVATE: boot AudioContext (lazy — must follow user gesture
     or willingly suspended until enable() is called)
     ───────────────────────────────────────────────────────────── */
  function _boot () {
    if (_ctx) return;
    _ctx = new (window.AudioContext || window.webkitAudioContext)();

    /* Master gain — starts at 0 (muted) */
    _masterGain = _ctx.createGain();
    _masterGain.gain.setValueAtTime(0, _ctx.currentTime);
    _masterGain.connect(_ctx.destination);

    /* Drone oscillator — persistent, gain-controlled */
    _droneOsc  = _ctx.createOscillator();
    _droneGain = _ctx.createGain();
    _droneOsc.type      = 'sine';
    _droneOsc.frequency.setValueAtTime(DRONE_FREQ, _ctx.currentTime);
    _droneGain.gain.setValueAtTime(0, _ctx.currentTime);
    _droneOsc.connect(_droneGain);
    _droneGain.connect(_masterGain);
    _droneOsc.start();

    /* Context must be suspended until user opts in */
    if (!_enabled) _ctx.suspend();
  }

  /* ─────────────────────────────────────────────────────────────
     PRIVATE: create a short burst of white noise
     Returns a BufferSourceNode ready to be connected + started
     ───────────────────────────────────────────────────────────── */
  function _noiseBuffer (durationSec) {
    const sampleRate  = _ctx.sampleRate;
    const frameCount  = Math.ceil(sampleRate * durationSec);
    const buffer      = _ctx.createBuffer(1, frameCount, sampleRate);
    const data        = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = _ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  /* ─────────────────────────────────────────────────────────────
     PRIVATE: show first-interaction toast (once only)
     ───────────────────────────────────────────────────────────── */
  function _showToast () {
    if (_toastShown) return;
    _toastShown = true;

    const toast = document.createElement('div');
    toast.id        = 'jx-audio-toast';
    toast.className = 'jx-audio-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <span class="jx-audio-toast-msg">This experience has audio.</span>
      <button class="jx-audio-toast-btn" id="jx-audio-enable" type="button">Enable</button>
      <button class="jx-audio-toast-dismiss" id="jx-audio-dismiss" aria-label="Dismiss">✕</button>
    `;
    document.body.appendChild(toast);

    /* Animate in */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });

    const dismiss = () => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    document.getElementById('jx-audio-enable').addEventListener('click', () => {
      JXAudio.enable();
      dismiss();
    });
    document.getElementById('jx-audio-dismiss').addEventListener('click', dismiss);

    /* Auto-dismiss after 8 s if user ignores it */
    setTimeout(dismiss, 8000);
  }

  /* ─────────────────────────────────────────────────────────────
     PUBLIC API
     ───────────────────────────────────────────────────────────── */
  const JXAudio = {

    /* ── enable — opt in, resume context, ramp master gain ── */
    enable () {
      _boot();
      _enabled = true;
      _ctx.resume().then(() => {
        _masterGain.gain.cancelScheduledValues(_ctx.currentTime);
        _masterGain.gain.linearRampToValueAtTime(1, _ctx.currentTime + 0.4);
      });
      /* Sync toggle button state */
      const btn = document.getElementById('nav-audio-toggle');
      if (btn) { btn.classList.add('active'); btn.setAttribute('aria-label', 'Mute audio'); }
    },

    /* ── disable — opt out, ramp to silence, suspend ── */
    disable () {
      if (!_ctx) return;
      _enabled = false;
      _masterGain.gain.cancelScheduledValues(_ctx.currentTime);
      _masterGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 0.3);
      setTimeout(() => { if (!_enabled && _ctx) _ctx.suspend(); }, 350);
      /* Sync toggle button state */
      const btn = document.getElementById('nav-audio-toggle');
      if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-label', 'Enable audio'); }
    },

    /* ── toggle ── */
    toggle () {
      _enabled ? this.disable() : this.enable();
    },

    /* ── drone — call on scroll with progress 0..1 ──
       Gain fades up as you scroll into the page, then fades out
       past 70% (when particle sculpting takes over the mood).      */
    drone (scrollProgress) {
      _boot();
      if (!_enabled || !_droneGain) return;
      const p   = Math.max(0, Math.min(1, scrollProgress));
      /* Bell curve: peak at ~30%, silence at 0 and at 1 */
      const env = p < 0.3
        ? p / 0.3
        : p < 0.7
          ? 1 - (p - 0.3) / 0.4
          : 0;
      const target = env * DRONE_MAX_GAIN;
      _droneGain.gain.cancelScheduledValues(_ctx.currentTime);
      _droneGain.gain.linearRampToValueAtTime(target, _ctx.currentTime + 0.3);
    },

    /* ── morphWhisper — 200–2000 Hz bandpass noise burst ── */
    morphWhisper () {
      _boot();
      if (!_enabled) return;

      const now   = _ctx.currentTime;
      const noise = _noiseBuffer(WHISPER_DECAY + 0.05);

      /* Bandpass filter */
      const bpf   = _ctx.createBiquadFilter();
      bpf.type            = 'bandpass';
      bpf.frequency.value = (WHISPER_FREQ_LO + WHISPER_FREQ_HI) / 2; // 1100 Hz
      bpf.Q.value         = (WHISPER_FREQ_LO + WHISPER_FREQ_HI) /
                            (WHISPER_FREQ_HI - WHISPER_FREQ_LO) * 0.5; // ~0.30

      /* Envelope gain */
      const env = _ctx.createGain();
      env.gain.setValueAtTime(0.18, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + WHISPER_DECAY);

      noise.connect(bpf);
      bpf.connect(env);
      env.connect(_masterGain);
      noise.start(now);
      noise.stop(now + WHISPER_DECAY + 0.05);
    },

    /* ── sculptPing — resonant 220 Hz sine, proportional to force ──
       force: 0..1 (explosion radius / max expected radius)            */
    sculptPing (force) {
      _boot();
      if (!_enabled) return;

      const f   = Math.max(0, Math.min(1, force || 0.5));
      const now = _ctx.currentTime;
      const dur = 0.4 + f * 0.8; // longer decay for harder hits

      const osc = _ctx.createOscillator();
      osc.type            = 'sine';
      osc.frequency.setValueAtTime(PING_FREQ, now);
      /* Pitch bend: sharp attack, slight detune over time */
      osc.frequency.exponentialRampToValueAtTime(PING_FREQ * 0.5, now + dur);

      const env = _ctx.createGain();
      env.gain.setValueAtTime(f * PING_MAX_GAIN, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(env);
      env.connect(_masterGain);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    },

    /* ── hoverTick — brief 1200 Hz click ── */
    hoverTick () {
      _boot();
      if (!_enabled) return;

      const now = _ctx.currentTime;
      const osc = _ctx.createOscillator();
      osc.type            = 'triangle';
      osc.frequency.value = TICK_FREQ;

      const env = _ctx.createGain();
      env.gain.setValueAtTime(0.04, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + TICK_DUR);

      osc.connect(env);
      env.connect(_masterGain);
      osc.start(now);
      osc.stop(now + TICK_DUR + 0.01);
    },

    /* ── isEnabled ── */
    get enabled () { return _enabled; },
  };

  /* ─────────────────────────────────────────────────────────────
     FIRST INTERACTION: show toast once on first meaningful event
     Non-blocking — does not auto-enable audio.
     ───────────────────────────────────────────────────────────── */
  const _firstInteractionEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  const _onFirstInteraction = () => {
    _firstInteractionEvents.forEach(ev =>
      document.removeEventListener(ev, _onFirstInteraction)
    );
    /* Small delay so page paint settles first */
    setTimeout(_showToast, 1200);
  };
  _firstInteractionEvents.forEach(ev =>
    document.addEventListener(ev, _onFirstInteraction, { once: true, passive: true })
  );

  /* ─────────────────────────────────────────────────────────────
     SCROLL DRONE: wire scroll position → drone() automatically
     ───────────────────────────────────────────────────────────── */
  let _scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (_scrollTicking) return;
    _scrollTicking = true;
    requestAnimationFrame(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress  = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      JXAudio.drone(progress);
      _scrollTicking = false;
    });
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────
     HOVER TICK: auto-attach to interactive elements via delegation
     ───────────────────────────────────────────────────────────── */
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('a, button, [data-cursor], [role="button"]');
    if (el) JXAudio.hoverTick();
  });

  /* Expose globally */
  window.JXAudio = JXAudio;

})();
