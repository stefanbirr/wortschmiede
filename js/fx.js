/* Rueckmeldung: Klang, Vibration, Funken. Alles optional und leise abschaltbar. */

import { theme } from './themes.js';
import { getSettings } from './store.js';
import { el } from './util.js';

let ctx = null;
function audio() {
  if (!getSettings().sound) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Kurzer synthetischer Ton – kein Asset-Download, funktioniert offline. */
export function sfx(name) {
  const spec = theme().sfx?.[name];
  const ac = audio();
  if (!spec || !ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, spec.sweep), t0 + spec.dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + spec.dur + 0.02);
}

export function buzz(pattern = 12) {
  if (!getSettings().haptics) return;
  navigator.vibrate?.(pattern);
}

/** Funkenregen an der Position eines Elements. */
export function sparks(target, count = 16) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = (target?.getBoundingClientRect?.() ?? { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 });
  const host = el('div.sparks');
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 140;
    host.append(el('span.spark', {
      style: `left:${cx}px; top:${cy}px; --dx:${Math.cos(angle) * dist}px; --dy:${Math.sin(angle) * dist - 40}px; --dur:${0.5 + Math.random() * 0.5}s; width:${3 + Math.random() * 5}px; height:${3 + Math.random() * 5}px`,
    }));
  }
  document.body.append(host);
  setTimeout(() => host.remove(), 1200);
}

export function hit(node) {
  if (!node) return;
  node.classList.remove('hit');
  void node.offsetWidth;
  node.classList.add('hit');
}

/* ---- Sprachausgabe ------------------------------------------------------ */
let voices = [];
const loadVoices = () => { voices = speechSynthesis?.getVoices?.() || []; };
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
export const speechAvailable = () => 'speechSynthesis' in window;

export function speak(text, lang = 'en') {
  if (!getSettings().speech || !speechAvailable() || !text) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const match = voices.find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));
    if (match) u.voice = match;
    u.lang = match?.lang || lang;
    u.rate = 0.95;
    speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
