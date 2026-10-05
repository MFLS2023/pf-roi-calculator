/** Minimal DOM helpers — no framework, no virtual DOM, no surprises. */

/** `querySelector` that throws instead of silently returning `null`. */
export function must<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`[pf-roi] required element not found: ${selector}`);
  return node;
}

/** `querySelector` that returns `null` when absent. */
export function qs<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(selector);
}

/** Create an element with attributes and children in one call. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | null | undefined> = {},
  children: Array<Node | string | null | undefined> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'html') node.innerHTML = String(value);
    else if (key.startsWith('data-') || key === 'role' || key === 'aria-hidden') {
      node.setAttribute(key, String(value));
    } else if (key in node) {
      (node as unknown as Record<string, unknown>)[key] = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Replace an element's text, replaying a short highlight animation when it changed. */
export function setText(node: Element | null, text: string, animate = true): void {
  if (!node) return;
  if (node.textContent === text) return;
  node.textContent = text;
  if (!animate) return;
  node.classList.remove('is-flashing');
  // Force a reflow so the animation can restart on consecutive updates.
  void (node as HTMLElement).offsetWidth;
  node.classList.add('is-flashing');
}
