import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Field,
  RadioGroup,
  SelectField,
  TextareaField,
} from '../../../components/Field';
import FileInput from '../../../components/FileInput';
import ScenarioFrame from '../../../components/ScenarioFrame';
import ValidationSummary from '../../../components/ValidationSummary';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'company-screening-form' as const;

const YEARS_OPTIONS = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-8', label: '5–8 years' },
  { value: '8+', label: '8+ years' },
];

export default function CompanyScreeningForm() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    coverNote: '',
    yearsExperience: '',
    workAuthorization: '',
    requiresSponsorship: '',
    sponsorshipDetails: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);
  const [started, setStarted] = useState(false);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const showSponsorshipDetails = fields.requiresSponsorship === 'yes';

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
      {!started ? (
        <p data-stage="jd">
          <button
            type="button"
            data-action="start-application"
            onClick={() => setStarted(true)}
          >
            Start application →
          </button>
        </p>
      ) : (
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
        <Field
          name="location"
          label="Current location"
          required
          value={fields.location}
          onChange={(v) => setField('location', v)}
        />

        <h3>Resume and cover note</h3>
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
        <TextareaField
          name="coverNote"
          label="Cover note"
          required
          rows={5}
          value={fields.coverNote}
          onChange={(v) => setField('coverNote', v)}
          description="A few sentences explaining why this role interests you."
        />

        <h3>Screening</h3>
        <SelectField
          name="yearsExperience"
          label="Years of professional experience"
          required
          value={fields.yearsExperience}
          onChange={(v) => setField('yearsExperience', v)}
          options={YEARS_OPTIONS}
          placeholder="Select…"
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
        <RadioGroup
          name="requiresSponsorship"
          label="Will you now or in the future require sponsorship for employment?"
          required
          value={fields.requiresSponsorship}
          onChange={(v) => setField('requiresSponsorship', v)}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
        />
        {showSponsorshipDetails && (
          <TextareaField
            name="sponsorshipDetails"
            label="Sponsorship details"
            value={fields.sponsorshipDetails}
            onChange={(v) => setField('sponsorshipDetails', v)}
            description="Optional but helpful: visa type, timing, etc."
          />
        )}

        <ValidationSummary validation={validation} />
        <button type="submit" data-action="submit-application">
          Submit application
        </button>
      </form>
      )}
    </ScenarioFrame>
  );
}
