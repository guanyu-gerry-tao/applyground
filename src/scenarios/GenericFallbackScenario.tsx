import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScenarioMeta, SubmissionFileMetadata } from '../types/scenario';
import { Field, TextareaField } from '../components/Field';
import FileInput from '../components/FileInput';
import ScenarioFrame from '../components/ScenarioFrame';
import ValidationSummary from '../components/ValidationSummary';
import { buildSubmission, saveLatestToSession } from '../lib/submission';
import type { SubmissionValidationResult } from '../types/scenario';

interface GenericFallbackScenarioProps {
  meta: ScenarioMeta;
}

export default function GenericFallbackScenario({ meta }: GenericFallbackScenarioProps) {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);

  const setField = (name: string, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = buildSubmission({ scenarioMeta: meta, fields, files });
    setValidation(submission.validation);
    if (!submission.validation.passed) return;
    saveLatestToSession(submission);
    navigate(`/confirmation/${meta.id}`);
  };

  return (
    <ScenarioFrame meta={meta}>
      <p data-stub-notice="">
        This scenario does not yet have a custom form. The generic fallback below collects the
        scenario&apos;s expected fields so the submission flow can still be exercised end-to-end.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        {meta.expectedFields.map((f) => {
          if (f.name === 'resume' || f.name === 'coverLetter') {
            return (
              <FileInput
                key={f.name}
                name={f.name}
                label={f.label}
                required={f.required}
                value={files.filter((file) => file.field === f.name)}
                onChange={(next) => {
                  setFiles((prev) => [
                    ...prev.filter((file) => file.field !== f.name),
                    ...next,
                  ]);
                }}
              />
            );
          }
          if (f.name === 'coverNote' || f.name === 'whyInterested' || f.name === 'shadowComment') {
            return (
              <TextareaField
                key={f.name}
                name={f.name}
                label={f.label}
                required={f.required}
                value={fields[f.name] ?? ''}
                onChange={(v) => setField(f.name, v)}
              />
            );
          }
          return (
            <Field
              key={f.name}
              name={f.name}
              label={f.label}
              required={f.required}
              value={fields[f.name] ?? ''}
              onChange={(v) => setField(f.name, v)}
            />
          );
        })}

        <ValidationSummary validation={validation} />
        <button type="submit" data-action="submit-application">
          Submit application
        </button>
      </form>
    </ScenarioFrame>
  );
}
