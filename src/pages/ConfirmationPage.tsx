import { Link, useParams } from 'react-router-dom';
import { findScenarioMeta } from '../data/scenarios';
import { loadLatestFromSession } from '../lib/submission';
import JsonDownloadButton from '../components/JsonDownloadButton';

export default function ConfirmationPage() {
  const { scenarioId } = useParams();
  const meta = scenarioId ? findScenarioMeta(scenarioId) : undefined;

  if (!meta) {
    return (
      <section data-page="confirmation-not-found">
        <h1>Unknown scenario: {scenarioId}</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    );
  }

  const submission = loadLatestFromSession(meta.id);

  if (!submission) {
    return (
      <section data-page="confirmation" data-state="empty">
        <h1>Confirmation: {meta.title}</h1>
        <p>
          No submission was found in <code>sessionStorage</code> for this scenario. Submit the
          application form first, then return here.
        </p>
        <p>
          <Link to={`/scenarios/${meta.id}`}>Back to the form</Link> ·{' '}
          <Link to="/">Home</Link>
        </p>
      </section>
    );
  }

  return (
    <section data-page="confirmation" data-state="filled" data-scenario-id={meta.id}>
      <p>
        <Link to="/">Home</Link> / <Link to={`/types/${meta.typeId}`}>{meta.typeId}</Link> /{' '}
        <Link to={`/scenarios/${meta.id}`}>{meta.id}</Link> / <span>confirmation</span>
      </p>

      <h1>Submission received: {meta.title}</h1>
      <p>
        This page echoes the submission for automation operators. Nothing was sent over the
        network. The data is in <code>sessionStorage</code> only.
      </p>

      <section data-section="submission-summary">
        <h2>Summary</h2>
        <dl>
          <dt>Scenario</dt>
          <dd>{submission.scenarioId}</dd>
          <dt>Submitted at</dt>
          <dd>{submission.submittedAt}</dd>
          <dt>Validation</dt>
          <dd>
            {submission.validation.passed ? 'passed' : 'failed'}
            {submission.validation.missingRequiredFields.length > 0 && (
              <> — missing: {submission.validation.missingRequiredFields.join(', ')}</>
            )}
          </dd>
          <dt>Score</dt>
          <dd>
            {submission.score.points} / {submission.score.maxPoints}
            {submission.score.passed ? ' (passed)' : ''}
          </dd>
        </dl>
        {submission.score.notes.length > 0 && (
          <ul data-list="score-notes">
            {submission.score.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      <section data-section="raw-json">
        <h2>Raw JSON</h2>
        <pre data-content="submission-json">{JSON.stringify(submission, null, 2)}</pre>
        <JsonDownloadButton
          data={submission}
          filename={`applyground-${meta.id}.json`}
        />
      </section>
    </section>
  );
}
