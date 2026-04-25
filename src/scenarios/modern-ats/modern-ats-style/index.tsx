import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, SelectField, TextareaField } from '../../../components/Field';
import FileInput from '../../../components/FileInput';
import ScenarioFrame from '../../../components/ScenarioFrame';
import ValidationSummary from '../../../components/ValidationSummary';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'modern-ats-style' as const;

const NOTICE_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: '2w', label: '2 weeks' },
  { value: '1m', label: '1 month' },
  { value: '2m', label: '2 months' },
  { value: '3m+', label: '3 months or more' },
];

export default function ModernAtsStyle() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    whyInterested: '',
    noticePeriod: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = buildSubmission({ scenarioMeta: meta, fields, files });
    setValidation(submission.validation);
    if (!submission.validation.passed) return;
    saveLatestToSession(submission);
    navigate(`/confirmation/${SCENARIO_ID}`);
  };

  return (
    <ScenarioFrame meta={meta}>
      <form onSubmit={handleSubmit} noValidate>
        <h3>Contact</h3>
        <Field
          name="fullName"
          label="Full name"
          required
          value={fields.fullName}
          onChange={(v) => setField('fullName', v)}
          autoComplete="name"
        />
        <Field
          name="email"
          label="Email"
          kind="email"
          required
          value={fields.email}
          onChange={(v) => setField('email', v)}
          autoComplete="email"
        />
        <Field
          name="phone"
          label="Phone"
          kind="tel"
          value={fields.phone}
          onChange={(v) => setField('phone', v)}
          autoComplete="tel"
        />

        <h3>Files</h3>
        <FileInput
          name="resume"
          label="Resume"
          required
          accept=".pdf,.doc,.docx"
          value={files.filter((f) => f.field === 'resume')}
          onChange={(next) =>
            setFiles((prev) => [...prev.filter((f) => f.field !== 'resume'), ...next])
          }
        />
        <FileInput
          name="coverLetter"
          label="Cover letter (optional)"
          accept=".pdf,.doc,.docx,.txt"
          value={files.filter((f) => f.field === 'coverLetter')}
          onChange={(next) =>
            setFiles((prev) => [...prev.filter((f) => f.field !== 'coverLetter'), ...next])
          }
        />

        <h3>Links (optional)</h3>
        <Field
          name="linkedinUrl"
          label="LinkedIn URL"
          kind="url"
          value={fields.linkedinUrl}
          onChange={(v) => setField('linkedinUrl', v)}
        />
        <Field
          name="githubUrl"
          label="GitHub URL"
          kind="url"
          value={fields.githubUrl}
          onChange={(v) => setField('githubUrl', v)}
        />

        <h3>Short answers</h3>
        <TextareaField
          name="whyInterested"
          label="Why are you interested in this role?"
          required
          rows={4}
          value={fields.whyInterested}
          onChange={(v) => setField('whyInterested', v)}
        />
        <SelectField
          name="noticePeriod"
          label="Current notice period"
          required
          value={fields.noticePeriod}
          onChange={(v) => setField('noticePeriod', v)}
          options={NOTICE_OPTIONS}
          placeholder="Select…"
        />

        <ValidationSummary validation={validation} />
        <button type="submit" data-action="submit-application">
          Submit application
        </button>
      </form>
    </ScenarioFrame>
  );
}
