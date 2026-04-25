import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckboxField, Field } from '../../components/Field';
import FileInput from '../../components/FileInput';
import MultiStepModal from '../../components/MultiStepModal';
import ScenarioFrame from '../../components/ScenarioFrame';
import ValidationSummary from '../../components/ValidationSummary';
import { findScenarioMeta } from '../../data/scenarios';
import { buildSubmission, saveLatestToSession } from '../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../types/scenario';

const SCENARIO_ID = 'easy-apply-quickflow' as const;

export default function EasyApplyQuickFlow() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    confirmAccurate: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const totalSteps = 2;
  const step0Valid =
    !!fields.fullName?.trim() &&
    !!fields.email?.trim() &&
    !!files.find((f) => f.field === 'resume');
  const step1Valid = fields.confirmAccurate === 'yes';
  const stepValid = step === 0 ? step0Valid : step1Valid;

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
      <p>Two-step quick apply. Click Apply to open the flow.</p>
      <button type="button" data-action="open-apply" onClick={() => setOpen(true)}>
        Apply
      </button>

      <MultiStepModal
        open={open}
        title="Quick apply"
        stepIndex={step}
        totalSteps={totalSteps}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate>
          {step === 0 && (
            <fieldset data-step="0" data-step-label="contact-and-resume">
              <legend>Contact and resume</legend>
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

          {step === 1 && (
            <fieldset data-step="1" data-step-label="confirm">
              <legend>Confirm</legend>
              <CheckboxField
                name="confirmAccurate"
                label="The information I have provided is accurate."
                required
                checked={fields.confirmAccurate === 'yes'}
                onChange={(c) => setField('confirmAccurate', c ? 'yes' : '')}
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
      </MultiStepModal>
    </ScenarioFrame>
  );
}
