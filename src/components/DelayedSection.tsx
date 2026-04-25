import { useEffect, useState, type ReactNode } from 'react';

interface DelayedSectionProps {
  title: string;
  delayMs?: number;
  children: ReactNode;
}

/**
 * Reveals its children after a short timer plus an explicit user click.
 * Targets agents that must wait for layout shifts and then interact.
 */
export default function DelayedSection({ title, delayMs = 800, children }: DelayedSectionProps) {
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return (
    <section data-section="delayed-reveal" data-state={revealed ? 'revealed' : ready ? 'ready' : 'loading'}>
      <h3>{title}</h3>
      {!ready && <p data-loading-indicator="">Loading additional questions…</p>}
      {ready && !revealed && (
        <p>
          <button type="button" data-action="reveal-delayed" onClick={() => setRevealed(true)}>
            Show additional questions
          </button>
        </p>
      )}
      {revealed && <div data-delayed-content="">{children}</div>}
    </section>
  );
}
