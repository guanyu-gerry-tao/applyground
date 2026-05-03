import { useEffect, useId, useRef } from 'react';
import type { SubmissionFileMetadata } from '../types/scenario';

interface IframeUploadRegionProps {
  field: string;
  label: string;
  required?: boolean;
  value: SubmissionFileMetadata[];
  onChange: (files: SubmissionFileMetadata[]) => void;
}

const SRC_DOC = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <p>Upload your resume.</p>
    <input id="upload-input" type="file" />
    <script>
      const input = document.getElementById('upload-input');
      input.addEventListener('change', () => {
        const files = Array.from(input.files || []).map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          lastModified: f.lastModified,
        }));
        window.parent.postMessage({ kind: 'applyground:file-bridge', files }, '*');
      });
    </script>
  </body>
</html>`;

export default function IframeUploadRegion({
  field,
  label,
  required = false,
  value,
  onChange,
}: IframeUploadRegionProps) {
  const id = useId();
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow) return;
      const data = event.data as
        | { kind?: string; files?: Array<{ name: string; type: string; size: number; lastModified: number }> }
        | undefined;
      if (!data || data.kind !== 'applyground:file-bridge') return;
      const files = (data.files ?? []).map((f) => ({ field, ...f }));
      onChange(files);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [field, onChange]);

  return (
    <div data-field={field} data-required={required ? 'true' : 'false'} data-upload-region="">
      <p id={`field-${id}-label`}>
        <strong>{label}</strong>
        {required && <span aria-hidden="true"> *</span>}
      </p>
      <p>
        <small>
          Accepted formats: PDF, DOC, or DOCX.
        </small>
      </p>
      <iframe
        ref={ref}
        title={`${field}-upload`}
        srcDoc={SRC_DOC}
        sandbox="allow-scripts allow-same-origin"
        aria-labelledby={`field-${id}-label`}
      />
      {value.length > 0 && (
        <ul data-file-list="">
          {value.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              {f.name} <span data-file-meta="">({f.type || 'unknown'}, {f.size} bytes)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
