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
import WizardSteps from '../../../components/WizardSteps';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'enterprise-ats-style' as const;

const STEPS = [
  { id: 'personal', label: 'Personal information' },
  { id: 'address', label: 'Address' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'self-id', label: 'Optional self-identification' },
  { id: 'resume', label: 'Resume and review' },
];

const COUNTRY_OPTIONS = [
  { value: 'AU', label: 'Australia' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'CN', label: 'China' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'OTHER', label: 'Other' },
];

const EDUCATION_OPTIONS = [
  { value: 'high-school', label: 'High school' },
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelor', label: 'Bachelor’s degree' },
  { value: 'master', label: 'Master’s degree' },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

export default function EnterpriseAtsStyle() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    preferredStart: '',
    workAuthorization: '',
    requiresSponsorship: '',
    highestEducation: '',
    optionalGenderSelfId: '',
    optionalRaceSelfId: '',
    additionalNotes: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);
  const [started, setStarted] = useState(false);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const totalSteps = STEPS.length;

  const stepValid = (() => {
    if (step === 0)
      return (
        !!fields.firstName.trim() &&
        !!fields.lastName.trim() &&
        !!fields.email.trim() &&
        !!fields.phone.trim()
      );
    if (step === 1)
      return (
        !!fields.addressLine1.trim() &&
        !!fields.city.trim() &&
        !!fields.region.trim() &&
        !!fields.postalCode.trim() &&
        !!fields.country.trim()
      );
    if (step === 2)
      return (
        !!fields.preferredStart.trim() &&
        !!fields.workAuthorization.trim() &&
        !!fields.requiresSponsorship.trim() &&
        !!fields.highestEducation.trim()
      );
    if (step === 3) return true;
    if (step === 4) return !!files.find((f) => f.field === 'resume');
    return false;
  })();

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
        <>
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
          </fieldset>
        )}

        {step === 1 && (
          <fieldset data-step="address">
            <legend>Address</legend>
            <Field
              name="addressLine1"
              label="Street address"
              required
              value={fields.addressLine1}
              onChange={(v) => setField('addressLine1', v)}
              autoComplete="address-line1"
            />
            <Field
              name="city"
              label="City"
              required
              value={fields.city}
              onChange={(v) => setField('city', v)}
              autoComplete="address-level2"
            />
            <Field
              name="region"
              label="State / region"
              required
              value={fields.region}
              onChange={(v) => setField('region', v)}
              autoComplete="address-level1"
            />
            <Field
              name="postalCode"
              label="Postal code"
              required
              value={fields.postalCode}
              onChange={(v) => setField('postalCode', v)}
              autoComplete="postal-code"
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

        {step === 2 && (
          <fieldset data-step="eligibility">
            <legend>Eligibility</legend>
            <Field
              name="preferredStart"
              label="Preferred start date"
              kind="date"
              required
              value={fields.preferredStart}
              onChange={(v) => setField('preferredStart', v)}
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
            <SelectField
              name="highestEducation"
              label="Highest education completed"
              required
              value={fields.highestEducation}
              onChange={(v) => setField('highestEducation', v)}
              options={EDUCATION_OPTIONS}
              placeholder="Select…"
            />
          </fieldset>
        )}

        {step === 3 && (
          <fieldset data-step="self-id">
            <legend>Optional self-identification</legend>
            <p>
              These questions are optional. They are included to mirror the shape of common
              ATS forms. Skipping them is fine.
            </p>
            <Field
              name="optionalGenderSelfId"
              label="Gender (optional)"
              value={fields.optionalGenderSelfId}
              onChange={(v) => setField('optionalGenderSelfId', v)}
            />
            <Field
              name="optionalRaceSelfId"
              label="Race / ethnicity (optional)"
              value={fields.optionalRaceSelfId}
              onChange={(v) => setField('optionalRaceSelfId', v)}
            />
          </fieldset>
        )}

        {step === 4 && (
          <fieldset data-step="resume">
            <legend>Resume and review</legend>
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
              name="additionalNotes"
              label="Anything else?"
              value={fields.additionalNotes}
              onChange={(v) => setField('additionalNotes', v)}
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
        </>
      )}
    </ScenarioFrame>
  );
}
