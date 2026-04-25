import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Field,
  RadioGroup,
  SelectField,
} from '../../../components/Field';
import FileInput from '../../../components/FileInput';
import ScenarioFrame from '../../../components/ScenarioFrame';
import ValidationSummary from '../../../components/ValidationSummary';
import WizardSteps from '../../../components/WizardSteps';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'enterprise-ats-short' as const;

const STEPS = [
  { id: 'personal', label: 'Personal information' },
  { id: 'review', label: 'Eligibility and resume' },
];

const COUNTRY_OPTIONS = [
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'OTHER', label: 'Other' },
];

export default function EnterpriseAtsShort() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    workAuthorization: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const totalSteps = STEPS.length;
  const stepValid =
    step === 0
      ? !!fields.firstName.trim() &&
        !!fields.lastName.trim() &&
        !!fields.email.trim() &&
        !!fields.phone.trim() &&
        !!fields.city.trim() &&
        !!fields.country.trim()
      : !!fields.workAuthorization.trim() && !!files.find((f) => f.field === 'resume');

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
      <WizardSteps steps={STEPS} currentIndex={step} />
      <form onSubmit={handleSubmit} noValidate>
        {step === 0 && (
          <fieldset data-step="personal">
            <legend>Personal information</legend>
            <Field
              name="firstName"
              label="First name"
              required
              value={fields.firstName}
              onChange={(v) => setField('firstName', v)}
              autoComplete="given-name"
            />
            <Field
              name="lastName"
              label="Last name"
              required
              value={fields.lastName}
              onChange={(v) => setField('lastName', v)}
              autoComplete="family-name"
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
              required
              value={fields.phone}
              onChange={(v) => setField('phone', v)}
              autoComplete="tel"
            />
            <Field
              name="city"
              label="City"
              required
              value={fields.city}
              onChange={(v) => setField('city', v)}
              autoComplete="address-level2"
            />
            <SelectField
              name="country"
              label="Country"
              required
              value={fields.country}
              onChange={(v) => setField('country', v)}
              options={COUNTRY_OPTIONS}
              placeholder="Select country…"
            />
          </fieldset>
        )}

        {step === 1 && (
          <fieldset data-step="review">
            <legend>Eligibility and resume</legend>
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
          </fieldset>
        )}

        <ValidationSummary validation={validation} />

        <div data-step-controls="">
          {step > 0 && (
            <button type="button" data-action="step-back" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {step < totalSteps - 1 && (
            <button
              type="button"
              data-action="step-next"
              disabled={!stepValid}
              aria-disabled={!stepValid}
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            >
              Next
            </button>
          )}
          {step === totalSteps - 1 && (
            <button
              type="submit"
              data-action="submit-application"
              disabled={!stepValid}
              aria-disabled={!stepValid}
            >
              Submit application
            </button>
          )}
        </div>
      </form>
    </ScenarioFrame>
  );
}
