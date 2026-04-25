import { useEffect, useId, useRef } from 'react';

interface ShadowFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  description?: string;
  rows?: number;
}

/**
 * Renders a textarea inside an attached shadow root. Targets agents that
 * need to traverse shadow DOM to find form controls.
 */
export default function ShadowField({
  name,
  label,
  value,
  onChange,
  required = false,
  description,
  rows = 3,
}: ShadowFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const id = useId();
  const fieldId = `shadow-${id}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (host.shadowRoot) return; // already attached

    const root = host.attachShadow({ mode: 'open' });
    const labelEl = document.createElement('label');
    labelEl.htmlFor = fieldId;
    labelEl.textContent = label + (required ? ' *' : '');
    const ta = document.createElement('textarea');
    ta.id = fieldId;
    ta.name = name;
    ta.rows = rows;
    ta.required = required;
    ta.value = value;
    ta.addEventListener('input', () => onChange(ta.value));
    textareaRef.current = ta;
    root.appendChild(labelEl);
    root.appendChild(document.createElement('br'));
    root.appendChild(ta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep shadow textarea in sync if external state changes
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
    }
  }, [value]);

  return (
    <div data-field={name} data-required={required ? 'true' : 'false'} data-kind="shadow-dom">
      <p>
        <strong>Shadow DOM field below.</strong> The textarea is attached inside an open shadow
        root on the next element. Agents must traverse shadow DOM to fill it.
      </p>
      {description && <p data-field-description="">{description}</p>}
      <div ref={hostRef} data-shadow-host={name} />
    </div>
  );
}
