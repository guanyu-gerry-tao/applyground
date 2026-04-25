import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckboxField,
  Field,
  RadioGroup,
} from '../../components/Field';
import FileInput from '../../components/FileInput';
import ScenarioFrame from '../../components/ScenarioFrame';
import ValidationSummary from '../../components/ValidationSummary';
import { findScenarioMeta } from '../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../types/scenario';

const SCENARIO_ID = 'simple-company-form' as const;

export default function SimpleCompanyForm() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolioUrl: '',
    workAuthorization: '',
    confirmAccurate: '',
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
        <Field
          name="location"
          label="Current location"
          required
          value={fields.location}
          onChange={(v) => setField('location', v)}
          autoComplete="address-level2"
        />
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
        <Field
          name="portfolioUrl"
          label="Portfolio or profile URL"
          kind="url"
          value={fields.portfolioUrl}
          onChange={(v) => setField('portfolioUrl', v)}
        />
        <RadioGroup
          name="workAuthorization"
          label="Are you authorized to work in the listed location?"
          required
          value={fields.workAuthorization}
          onChange={(v) => setField('workAuthorization', v)}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
        />
        <CheckboxField
          name="confirmAccurate"
          label="The information I have provided is accurate."
          checked={fields.confirmAccurate === 'yes'}
          onChange={(c) => setField('confirmAccurate', c ? 'yes' : '')}
        />

        <ValidationSummary validation={validation} />
        <button type="submit" data-action="submit-application">
          Submit application
        </button>
      </form>
    </ScenarioFrame>
  );
}
