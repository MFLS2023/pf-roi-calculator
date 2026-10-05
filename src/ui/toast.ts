import { h, must, qs } from './dom';

export type ToastKind = 'info' | 'success' | 'error';

const STACK_ID = 'toast-stack';
const DEFAULT_DURATION = 2600;

function stack(): HTMLElement {
  const existing = qs<HTMLElement>(`#${STACK_ID}`);
  if (existing) return existing;
  const node = h('div', { id: STACK_ID, class: 'toast-stack', role: 'status', 'aria-live': 'polite' });
  document.body.append(node);
  return node;
}

/** Show a transient message at the bottom of the viewport. */
export function toast(message: string, kind: ToastKind = 'info', duration = DEFAULT_DURATION): void {
  const node = h('div', {
    class: kind === 'info' ? 'toast' : `toast toast--${kind}`,
    text: message,
  });
  const host = stack();
  host.append(node);
  window.setTimeout(() => {
    node.style.transition = 'opacity .2s ease';
    node.style.opacity = '0';
    window.setTimeout(() => node.remove(), 220);
  }, duration);
}

/** Announce a message to assistive tech without showing a visual toast. */
export function announce(message: string): void {
  const live = must<HTMLElement>('#sr-live');
  live.textContent = '';
  window.setTimeout(() => {
    live.textContent = message;
  }, 30);
}
