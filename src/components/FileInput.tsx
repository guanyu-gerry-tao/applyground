import type { ChangeEvent } from 'react';
import type { SubmissionFileMetadata } from '../types/scenario';
import { fileToMetadata } from '../lib/submission';

interface FileInputProps {
  name: string;
  label: string;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  description?: string;
  value: SubmissionFileMetadata[];
  onChange: (files: SubmissionFileMetadata[]) => void;
  error?: string;
}

export default function FileInput({
  name,
  label,
  required = false,
  accept,
  multiple = false,
  description,
  value,
  onChange,
  error,
}: FileInputProps) {
  const id = `field-${name}`;
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      onChange([]);
      return;
    }
    const metas: SubmissionFileMetadata[] = [];
    for (const file of Array.from(files)) {
      metas.push(fileToMetadata(name, file));
    }
    onChange(metas);
  };

  return (
    <div data-field={name} data-required={required ? 'true' : 'false'} data-kind="file">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <p data-field-description="">
        Metadata-only upload. The file is not sent or stored. Only the file&apos;s name, type, size,
        and last-modified time are recorded.
        {description ? ` ${description}` : ''}
      </p>
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        onChange={handleChange}
      />
      {value.length > 0 && (
        <ul data-file-list="">
          {value.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              {f.name} <span data-file-meta="">({f.type || 'unknown type'}, {f.size} bytes)</span>
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
