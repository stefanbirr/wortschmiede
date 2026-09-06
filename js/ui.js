/* Wiederverwendbare UI-Bausteine: Toast, Modal, Stufenanzeige. */

import { el, $ } from './util.js';
import { stageName } from './themes.js';

export function toast(message, ms = 2400) {
  const host = $('#toast-host');
  const node = el('div.toast', {}, message);
  host.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .25s';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 260);
  }, ms);
}

export function modal({ title, body, actions = [] }) {
  const host = $('#modal-host');
  host.hidden = false;
  host.innerHTML = '';
  const close = () => { host.hidden = true; host.innerHTML = ''; };
  const box = el('div.modal', { role: 'dialog', 'aria-modal': 'true' },
    title ? el('h2', {}, title) : null,
    typeof body === 'string' ? el('p', {}, body) : body,
    el('div.row', { style: 'justify-content:flex-end; margin-top:14px' },
      actions.map((a) => el('button.btn' + (a.primary ? '.btn--primary' : a.danger ? '.btn--danger' : ''), {
        onclick: () => { close(); a.onClick?.(); },
      }, a.label))),
  );
  host.append(box);
  host.onclick = (e) => { if (e.target === host) close(); };
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
  });
  box.querySelector('.btn')?.focus();
  return close;
}

export function confirmDialog(title, text, onYes, { danger = true, yes = 'Ja, machen', no = 'Abbrechen' } = {}) {
  modal({
    title,
    body: text,
    actions: [
      { label: no },
      { label: yes, danger, primary: !danger, onClick: onYes },
    ],
  });
}

/** Fortschrittsbalken 0..5 mit Theme-Namen als Tooltip. */
export function stageDots(stage) {
  const wrap = el('span.stage', { title: stageName(stage), 'aria-label': `Stufe: ${stageName(stage)}` });
  for (let i = 1; i <= 5; i++) wrap.append(el('i', { class: i <= stage ? 'on' : '' }));
  return wrap;
}

export function bar(pct) {
  return el('div.bar', {}, el('div.bar__fill', { style: `width:${Math.max(0, Math.min(100, pct))}%` }));
}

export function empty(icon, title, text, action) {
  return el('div.empty', {},
    el('span.empty__icon', {}, icon),
    el('h2', {}, title),
    el('p.small', {}, text),
    action || null);
}
