import { Link, useParams } from 'react-router-dom';
import { findScenarioMeta } from '../data/scenarios';
import { loadLatestFromSession } from '../lib/submission';
import type { ScenarioId } from '../types/scenario';

function parseScoreSearch(search: string): Record<string, string> {
  const raw = search.replace(/^\?/, '');
  const values: Record<string, string> = {};

  const decode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  for (const part of raw.split(/[&;]/)) {
    const [key, ...rest] = part.split('=');
    if (!key) continue;
    values[decode(key.trim())] = decode(rest.join('=').trim());
  }

  return values;
}

function parseNonNegativeSeconds(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatElapsedSeconds(value: string): string {
  const seconds = parseNonNegativeSeconds(value);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const minuteRemainder = minutes % 60;
  return minuteRemainder ? `${hours}h ${minuteRemainder}m` : `${hours}h`;
}

function openJsonEcho(data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.location.assign(url);
}

export default function ScorePage() {
  const { scenarioId } = useParams();
  const meta = scenarioId ? findScenarioMeta(scenarioId as ScenarioId) : undefined;
  const scoreParams = parseScoreSearch(window.location.search);

  if (!meta) {
    return (
      <section data-page="score-not-found">
        <h1>Unknown scenario: {scenarioId}</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    );
  }

  const submission = loadLatestFromSession(meta.id);
  const jdId = scoreParams.id ?? '0';
  const dataset = scoreParams.dataset;
  const seconds = scoreParams.sec ?? '0';
  const filled = scoreParams.filled ?? '0%';
  const elapsedLabel = formatElapsedSeconds(seconds);
  const rawSeconds = String(parseNonNegativeSeconds(seconds));
  const resultLabel = submission
    ? (submission.score.passed ? 'Passed' : 'Failed')
    : 'No local submission';
  const scoreState = submission
    ? (submission.score.passed ? 'passed' : 'failed')
    : 'unknown';
  const scoreLabel = submission
    ? `${submission.score.points} / ${submission.score.maxPoints}`
    : 'Not available';
  const jdSearch = new URLSearchParams({ scenarios: meta.id, id: jdId });
  if (dataset) jdSearch.set('dataset', dataset);

  return (
    <section data-page="score" data-scenario-id={meta.id} data-jd-id={jdId}>
      <h1>Application score</h1>
      <p data-score-intro="">
        This page reports the local result calculated after submit. Nothing was sent over the
        network.
      </p>

      <section data-section="score-summary">
        <div data-score-summary-header="">
          <div>
            <p data-score-kicker="">Run summary</p>
            <h2>Local result</h2>
          </div>
          <span
            data-score-status=""
            data-state={scoreState}
          >
            {resultLabel}
          </span>
        </div>

        <dl data-score-metrics="">
          <div data-score-metric="time">
            <dt>Application time</dt>
            <dd data-score-value={rawSeconds}>{elapsedLabel}</dd>
            <p>Started when this JD opened.</p>
          </div>
          <div data-score-metric="filled">
            <dt>Filled</dt>
            <dd>{filled}</dd>
            <p>Estimated from the local rubric.</p>
          </div>
          <div data-score-metric="rubric">
            <dt>Rubric score</dt>
            <dd>{scoreLabel}</dd>
            <p>Anything below full score fails.</p>
          </div>
        </dl>

        <dl data-score-details="">
          <dt>Scenario</dt>
          <dd>{meta.id}</dd>
          <dt>JD id</dt>
          <dd>{jdId}</dd>
          {dataset && (
            <>
              <dt>Dataset</dt>
              <dd>{dataset}</dd>
            </>
          )}
          {submission && (
            <>
              <dt>Required answers</dt>
              <dd>
                {submission.validation.passed ? 'complete' : 'incomplete'}
                {submission.validation.missingRequiredFields.length > 0 && (
                  <> - missing: {submission.validation.missingRequiredFields.join(', ')}</>
                )}
              </dd>
              <dt>Final result</dt>
              <dd>{submission.score.passed ? 'passed' : 'failed'}</dd>
              {submission.score.notes.length > 0 && (
                <>
                  <dt>Notes</dt>
                  <dd>{submission.score.notes.join(' ')}</dd>
                </>
              )}
            </>
          )}
        </dl>
      </section>

      <nav data-score-actions="" aria-label="Score actions">
        <Link to={`/jd?${jdSearch.toString()}`} data-score-action="primary">
          Return to this JD
        </Link>
        <button
          type="button"
          data-score-action="secondary"
          disabled={!submission}
          onClick={() => {
            if (submission) openJsonEcho(submission);
          }}
        >
          View JSON echo
        </button>
      </nav>
    </section>
  );
}
