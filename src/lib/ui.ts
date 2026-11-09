export function spotlight(node: HTMLElement) {
  const move = (e: PointerEvent) => {
    const r = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${e.clientX - r.left}px`);
    node.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  node.addEventListener('pointermove', move);
  return { destroy: () => node.removeEventListener('pointermove', move) };
}

export function autofocus(node: HTMLElement): void {
  node.focus();
}

export type Tone = 'live' | 'ok' | 'bad' | 'idle';

// Guesses a colour from the status text; adjust the patterns to your real run statuses.
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (/fail|error|cancel|timeout/.test(s)) return 'bad';
  if (/complete|done|success|finish/.test(s)) return 'ok';
  if (/run|start|progress|pending|queue/.test(s)) return 'live';
  return 'idle';
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}