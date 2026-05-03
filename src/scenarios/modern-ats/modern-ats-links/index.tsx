import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, TextareaField } from '../../../components/Field';
import FileInput from '../../../components/FileInput';
import ScenarioFrame from '../../../components/ScenarioFrame';
import ValidationSummary from '../../../components/ValidationSummary';
import { findScenarioMeta } from '../../../data/scenarios';
import { buildScoreUrl, buildSubmission, saveLatestToSession } from '../../../lib/submission';
import type {
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../../../types/scenario';

const SCENARIO_ID = 'modern-ats-links' as const;

export default function ModernAtsLinks() {
  const meta = findScenarioMeta(SCENARIO_ID);
  if (!meta) throw new Error(`Scenario meta missing: ${SCENARIO_ID}`);
  const navigate = useNavigate();

  const [fields, setFields] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    linkedinUrl: '',
    githubUrl: '',
    writingSampleUrl: '',
    portfolioUrl: '',
    projectUrl: '',
    whyInterested: '',
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

        <h3>Links</h3>
        <p>
          A writing-sample URL is required for this role. The other links are optional but
          help us evaluate your work faster.
        </p>
        <Field
          name="writingSampleUrl"
          label="Writing sample URL"
          kind="url"
          required
          value={fields.writingSampleUrl}
          onChange={(v) => setField('writingSampleUrl', v)}
        />
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
        <Field
          name="portfolioUrl"
          label="Portfolio URL"
          kind="url"
          value={fields.portfolioUrl}
          onChange={(v) => setField('portfolioUrl', v)}
        />
        <Field
          name="projectUrl"
          label="A project you are proud of"
          kind="url"
          value={fields.projectUrl}
          onChange={(v) => setField('projectUrl', v)}
        />

        <h3>Short answer</h3>
        <TextareaField
          name="whyInterested"
          label="Why are you interested in this role?"
          required
          rows={4}
          value={fields.whyInterested}
          onChange={(v) => setField('whyInterested', v)}
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
