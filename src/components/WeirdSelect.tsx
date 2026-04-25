import { useEffect, useId, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface WeirdSelectProps {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
}

export default function WeirdSelect({
  name,
  label,
  required = false,
  description,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
}: WeirdSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonId = `weird-${id}`;
  const listId = `weird-${id}-list`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div
      data-field={name}
      data-required={required ? 'true' : 'false'}
      data-kind="custom-select"
      ref={containerRef}
    >
      <p>
        <span data-label-for={buttonId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </span>
      </p>
      {description && <p data-field-description="">{description}</p>}
      <button
        type="button"
        id={buttonId}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-invalid={error ? 'true' : 'false'}
        data-action="toggle-weird-select"
        onClick={() => setOpen((o) => !o)}
      >
        {current ? current.label : placeholder}
      </button>
      {/* hidden input keeps name/value discoverable for form-data style scrapers */}
      <input type="hidden" name={name} value={value} />
      {open && (
        <ul id={listId} role="listbox" data-weird-list="">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              data-option-value={opt.value}
              tabIndex={0}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p data-field-error="" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
