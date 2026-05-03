import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../../../components/Field';
import AmbiguousLabelGroup from '../../../components/AmbiguousLabelGroup';
import DelayedSection from '../../../components/DelayedSection';
import IframeUploadRegion from '../../../components/IframeUploadRegion';
import ScenarioFrame from '../../../components/ScenarioFrame';
import ShadowField from '../../../components/ShadowField';
import ValidationSummary from '../../../components/ValidationSummary';
import WeirdSelect from '../../../components/WeirdSelect';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildScoreUrl, buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'hostile-edge-cases' as const;

const CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
];

export default function HostileEdgeCases() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    preferredContact: '',
    additionalInfo: '',
    availability: '',
    legalSignature: '',
  });
  const [files, setFiles] = useState<SubmissionFileMetadata[]>([]);
  const [validation, setValidation] = useState<SubmissionValidationResult | null>(null);
  const [started, setStarted] = useState(false);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = buildSubmission({ scenarioMeta: meta, fields, files });
    setValidation(submission.validation);
    if (!submission.validation.passed) return;
    saveLatestToSession(submission);
    navigate(buildScoreUrl(SCENARIO_ID, submission));
  };

  return (
    <ScenarioFrame meta={meta}>
      <p>
        Complete the application below. Some sections may appear after the form loads.
      </p>
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
        <AmbiguousLabelGroup
          fullName={fields.fullName}
          email={fields.email}
          onFullNameChange={(v) => setField('fullName', v)}
          onEmailChange={(v) => setField('email', v)}
        />

        <WeirdSelect
          name="preferredContact"
          label="Preferred contact method"
          required
          value={fields.preferredContact}
          onChange={(v) => setField('preferredContact', v)}
          options={CONTACT_OPTIONS}
        />

        <ShadowField
          name="additionalInfo"
          label="Anything else?"
          required
          value={fields.additionalInfo}
          onChange={(v) => setField('additionalInfo', v)}
          description="Share any additional context you want the team to know."
        />

        <DelayedSection title="Availability">
          <Field
            name="availability"
            label="When are you available to start?"
            required
            value={fields.availability}
            onChange={(v) => setField('availability', v)}
          />
        </DelayedSection>

        <fieldset data-field="authorization">
          <legend>Important authorization</legend>
          <p>
            Please type your full legal name here to certify that you personally reviewed this
            application.
          </p>
          <Field
            name="legalSignature"
            label="Legal signature"
            value={fields.legalSignature}
            onChange={(v) => setField('legalSignature', v)}
          />
        </fieldset>

        <IframeUploadRegion
          field="resume"
          label="Resume"
          required
          value={files.filter((f) => f.field === 'resume')}
          onChange={(next) =>
            setFiles((prev) => [...prev.filter((f) => f.field !== 'resume'), ...next])
          }
        />

        <ValidationSummary validation={validation} />
        <button type="submit" data-action="submit-application">
          Submit application
        </button>
      </form>
      )}
    </ScenarioFrame>
  );
}
