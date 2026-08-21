/**
 * Web Audio API SOS Morse Code Alarm Generator
 *
 * Generates standard repeating Morse code SOS pattern:
 * S (...) -> 3 short tones
 * O (---) -> 3 long tones
 * S (...) -> 3 short tones
 *
 * Uses precision Web Audio oscillator scheduling with gain envelopes.
 * Completely zero external dependencies, robust lifecycle and zero memory leaks.
 */

let audioContext = null;
let masterGainNode = null;
let isAlarmRunning = false;
let loopTimeoutId = null;
let activeOscillators = new Set();

/**
 * Initializes or resumes the AudioContext on user interaction.
 * Returns true if the AudioContext is running.
 */
export const initAudioContext = async () => {
  if (typeof window === 'undefined') return false;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContextClass();
      masterGainNode = audioContext.createGain();
      masterGainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
      masterGainNode.connect(audioContext.destination);
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    return audioContext.state === 'running';
  } catch (error) {
    console.warn('AudioContext initialization failed:', error);
    return false;
  }
};

/**
 * Checks whether audio context is initialized and ready.
 */
export const isAudioArmed = () => {
  return !!(audioContext && audioContext.state === 'running');
};

/**
 * Schedule a single tone pulse with an anti-click gain envelope.
 */
const scheduleBeep = (startTime, duration, frequency = 880) => {
  if (!audioContext || !masterGainNode) return;

  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'triangle'; // Clean, crisp, highly audible without harshness
    osc.frequency.setValueAtTime(frequency, startTime);

    // Attack and decay envelope (8ms ramp) to avoid speaker pop/clicks
    const attackTime = 0.008;
    const releaseTime = 0.008;
    const stopTime = startTime + duration;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(1.0, startTime + attackTime);
    gain.gain.setValueAtTime(1.0, Math.max(startTime + attackTime, stopTime - releaseTime));
    gain.gain.linearRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(masterGainNode);

    osc.start(startTime);
    osc.stop(stopTime);

    activeOscillators.add(osc);

    osc.onended = () => {
      activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (_e) {}
    };
  } catch (err) {
    console.warn('Error scheduling beep:', err);
  }
};

/**
 * Schedules one full SOS cycle:
 * S: 3 short dots
 * O: 3 long dashes
 * S: 3 short dots
 * Total cycle duration is ~3.8 seconds.
 */
const scheduleSosCycle = () => {
  if (!isAlarmRunning || !audioContext || audioContext.state !== 'running') return;

  const now = audioContext.currentTime + 0.05; // 50ms scheduling buffer
  const dot = 0.12; // 120ms
  const dash = 0.36; // 360ms
  const intraGap = 0.10; // 100ms between elements
  const letterGap = 0.28; // 280ms between letters
  const cycleGap = 1.20; // 1200ms before next SOS

  let t = now;

  // Letter 1: 'S' (...)
  for (let i = 0; i < 3; i++) {
    scheduleBeep(t, dot, 880);
    t += dot + intraGap;
  }
  t += letterGap - intraGap;

  // Letter 2: 'O' (---)
  for (let i = 0; i < 3; i++) {
    scheduleBeep(t, dash, 880);
    t += dash + intraGap;
  }
  t += letterGap - intraGap;

  // Letter 3: 'S' (...)
  for (let i = 0; i < 3; i++) {
    scheduleBeep(t, dot, 880);
    t += dot + intraGap;
  }

  const totalCycleTimeMs = (t - now + cycleGap) * 1000;

  // Loop next cycle with timer
  if (isAlarmRunning) {
    loopTimeoutId = setTimeout(() => {
      if (isAlarmRunning) {
        scheduleSosCycle();
      }
    }, totalCycleTimeMs);
  }
};

/**
 * Starts the repeating SOS alarm loop.
 */
export const startSosAlarm = async () => {
  if (isAlarmRunning) return true;

  const ready = await initAudioContext();
  if (!ready) {
    console.warn('Cannot start SOS alarm: AudioContext not ready or blocked by browser autoplay.');
    return false;
  }

  isAlarmRunning = true;
  scheduleSosCycle();
  return true;
};

/**
 * Immediately terminates all active oscillators and stops the alarm loop.
 */
export const stopSosAlarm = () => {
  isAlarmRunning = false;

  if (loopTimeoutId) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }

  // Stop and disconnect all active oscillators
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (_e) {}
  });
  activeOscillators.clear();
};

/**
 * Returns whether alarm is currently active and playing.
 */
export const isSosAlarmPlaying = () => isAlarmRunning;
