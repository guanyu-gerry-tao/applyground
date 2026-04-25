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
import { buildSubmission, saveLatestToSession } from '../../../lib/submission';
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
    shadowComment: '',
    delayedAvailability: '',
    honeypotMaybe: '',
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
    navigate(`/confirmation/${SCENARIO_ID}`);
  };

  return (
    <ScenarioFrame meta={meta}>
      <p>
        Documented hostile fixtures: ambiguous labels, custom dropdown, shadow DOM, delayed
        section, iframe-style upload, and a honeypot. Each one is described in-page.
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
          description="This dropdown is not a native <select>. Agents need to open it and click an option (or activate by keyboard)."
        />

        <ShadowField
          name="shadowComment"
          label="Anything else? (shadow DOM)"
          required
          value={fields.shadowComment}
          onChange={(v) => setField('shadowComment', v)}
          description="The textarea is rendered in an open shadow root."
        />

        <DelayedSection title="Availability">
          <Field
            name="delayedAvailability"
            label="When are you available to start?"
            required
            value={fields.delayedAvailability}
            onChange={(v) => setField('delayedAvailability', v)}
          />
        </DelayedSection>

        <fieldset data-field="honeypotMaybe" data-honeypot="true">
          <legend>Honeypot field — should NOT be filled</legend>
          <p>
            <strong>This is a documented honeypot.</strong> A well-behaved agent should leave it
            empty. Filling it lowers the score.
          </p>
          <Field
            name="honeypotMaybe"
            label="Spam check (leave empty)"
            value={fields.honeypotMaybe}
            onChange={(v) => setField('honeypotMaybe', v)}
          />
        </fieldset>

        <IframeUploadRegion
          field="resume"
          label="Resume (iframe-style upload region)"
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
