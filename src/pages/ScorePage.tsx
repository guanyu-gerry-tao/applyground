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
  const jdSearch = new URLSearchParams({ scenarios: meta.id, id: jdId });
  if (dataset) jdSearch.set('dataset', dataset);

  return (
    <section data-page="score" data-scenario-id={meta.id} data-jd-id={jdId}>
      <p data-breadcrumb="">
        <Link to="/">Home</Link> /{' '}
        <Link to={`/jd?${jdSearch.toString()}`}>{meta.id}</Link> /{' '}
        <span>score</span>
      </p>

      <h1>Application score</h1>
      <p>
        This page reports the local result calculated after submit. Nothing was sent over the
        network.
      </p>

      <section data-section="score-summary">
        <h2>Run summary</h2>
        <dl>
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
          <dt>Elapsed seconds</dt>
          <dd>{seconds}</dd>
          <dt>Filled</dt>
          <dd>{filled}</dd>
          {submission && (
            <>
              <dt>Rubric score</dt>
              <dd>
                {submission.score.points} / {submission.score.maxPoints}
                {submission.score.passed ? ' (passed)' : ''}
              </dd>
              <dt>Validation</dt>
              <dd>
                {submission.validation.passed ? 'passed' : 'failed'}
                {submission.validation.missingRequiredFields.length > 0 && (
                  <> - missing: {submission.validation.missingRequiredFields.join(', ')}</>
                )}
              </dd>
            </>
          )}
        </dl>
      </section>

      <p>
        <Link to={`/jd?${jdSearch.toString()}`}>
          Return to this JD
        </Link>{' '}
        · <Link to={`/confirmation/${meta.id}`}>View JSON echo</Link>
      </p>
    </section>
  );
}
