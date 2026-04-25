import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Field,
  RadioGroup,
  SelectField,
} from '../../../components/Field';
import FileInput from '../../../components/FileInput';
import MultiStepModal from '../../../components/MultiStepModal';
import ScenarioFrame from '../../../components/ScenarioFrame';
import ValidationSummary from '../../../components/ValidationSummary';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'easy-apply-style' as const;

const YEARS_OPTIONS = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-8', label: '5–8 years' },
  { value: '8+', label: '8+ years' },
];

const STEP_REQUIRED: Record<number, (fields: Record<string, string>, files: SubmissionFileMetadata[]) => boolean> = {
  0: (f) => !!f.fullName?.trim() && !!f.email?.trim(),
  1: (f, files) => !!files.find((x) => x.field === 'resume') && !!f.portfolioUrl?.trim(),
  2: (f) => !!f.yearsExperience?.trim() && !!f.workAuthorization?.trim(),
};

export default function EasyApplyStyle() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    phone: '',
    portfolioUrl: '',
    yearsExperience: '',
    workAuthorization: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const totalSteps = 3;
  const stepValid = STEP_REQUIRED[step]?.(fields, files) ?? true;

  const goNext = () => {
    if (!stepValid) return;
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

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
      <p>This scenario simulates a multi-step modal application. Click Apply to open it.</p>
      <button type="button" data-action="open-apply" onClick={() => setOpen(true)}>
        Apply
      </button>

      <MultiStepModal
        open={open}
        title="Apply to this role"
        stepIndex={step}
        totalSteps={totalSteps}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate>
          {step === 0 && (
            <fieldset data-step="0" data-step-label="contact">
              <legend>Contact</legend>
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
            </fieldset>
          )}

          {step === 1 && (
            <fieldset data-step="1" data-step-label="resume-and-links">
              <legend>Resume and links</legend>
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
                label="Portfolio URL"
                kind="url"
                required
                value={fields.portfolioUrl}
                onChange={(v) => setField('portfolioUrl', v)}
              />
            </fieldset>
          )}

          {step === 2 && (
            <fieldset data-step="2" data-step-label="screening">
              <legend>Screening</legend>
              <SelectField
                name="yearsExperience"
                label="Years of experience"
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
            </fieldset>
          )}

          <ValidationSummary validation={validation} />

          <div data-step-controls="">
            {step > 0 && (
              <button type="button" data-action="step-back" onClick={goBack}>
                Back
              </button>
            )}
            {step < totalSteps - 1 && (
              <button
                type="button"
                data-action="step-next"
                onClick={goNext}
                disabled={!stepValid}
                aria-disabled={!stepValid}
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
      </MultiStepModal>
    </ScenarioFrame>
  );
}
