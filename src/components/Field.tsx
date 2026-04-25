import type { ChangeEvent, ReactNode } from 'react';

interface BaseFieldProps {
  name: string;
  label: string;
  required?: boolean;
  description?: ReactNode;
  error?: string;
}

interface InputFieldProps extends BaseFieldProps {
  kind?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'number';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}

export function Field({
  name,
  label,
  required = false,
  description,
  error,
  kind = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
}: InputFieldProps) {
  const id = `field-${name}`;
  return (
    <div data-field={name} data-required={required ? 'true' : 'false'}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {description && <p data-field-description="">{description}</p>}
      <input
        id={id}
        name={name}
        type={kind}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      {error && (
        <p data-field-error="" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextareaField({
  name,
  label,
  required = false,
  description,
  error,
  value,
  onChange,
  rows = 4,
  placeholder,
}: TextareaFieldProps) {
  const id = `field-${name}`;
  return (
    <div data-field={name} data-required={required ? 'true' : 'false'}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {description && <p data-field-description="">{description}</p>}
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
      {error && (
        <p data-field-error="" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({
  name,
  label,
  required = false,
  description,
  error,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  const id = `field-${name}`;
  return (
    <div data-field={name} data-required={required ? 'true' : 'false'}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {description && <p data-field-description="">{description}</p>}
      <select
        id={id}
        name={name}
        value={value}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p data-field-error="" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface RadioGroupProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function RadioGroup({
  name,
  label,
  required = false,
  description,
  error,
  value,
  onChange,
  options,
}: RadioGroupProps) {
  return (
    <fieldset data-field={name} data-required={required ? 'true' : 'false'}>
      <legend>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      {description && <p data-field-description="">{description}</p>}
      {options.map((opt) => {
        const id = `field-${name}-${opt.value}`;
        return (
          <label key={opt.value} htmlFor={id}>
            <input
              id={id}
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              required={required}
            />
            {opt.label}
          </label>
        );
      })}
      {error && (
        <p data-field-error="" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  name,
  label,
  required = false,
  description,
  error,
  checked,
  onChange,
}: CheckboxFieldProps) {
  const id = `field-${name}`;
  return (
    <div data-field={name} data-required={required ? 'true' : 'false'}>
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          name={name}
          checked={checked}
          required={required}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        />
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {description && <p data-field-description="">{description}</p>}
      {error && (
        <p data-field-error="" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
