import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { ScenarioId, ScenarioMeta } from '../types/scenario';
import { SCENARIO_META } from '../data/scenarios';
import { findJdByScenario } from '../data/jds';
import { startJdRunTimer } from '../lib/submission';
import {
  excerptFromJobHtml,
  findJsonlJobById,
  loadJsonlDataset,
  previewJobHtml,
  sanitizeJobHtml,
  type JsonlDatasetManifestEntry,
  type JsonlJobDescription,
} from '../data/jsonlJobs';

interface ScenarioFrameProps {
  meta: ScenarioMeta;
  children: ReactNode;
}

function readBooleanParam(value: string | null): boolean {
  return value === 'true' || value === '1' || value === 'yes';
}

function getJobUrlId(job: JsonlJobDescription): string {
  return String(job.id ?? job.custom_id);
}

function getPlatformWindowJobs(
  jobs: JsonlJobDescription[],
  currentJob: JsonlJobDescription | undefined,
): JsonlJobDescription[] {
  if (!jobs.length || !currentJob) return [];

  const currentIndex = jobs.findIndex((job) => (
    job === currentJob ||
    job.id === currentJob.id ||
    job.custom_id === currentJob.custom_id
  ));
  if (currentIndex < 0) return jobs.slice(0, 10);

  const lastIndex = jobs.length - 1;
  if (currentIndex <= 4) return jobs.slice(0, Math.min(10, jobs.length));
  if (currentIndex >= lastIndex - 4) return jobs.slice(Math.max(0, jobs.length - 10));

  return jobs.slice(Math.max(0, currentIndex - 5), Math.min(jobs.length, currentIndex + 6));
}

function getJobIndex(
  jobs: JsonlJobDescription[],
  currentJob: JsonlJobDescription | undefined,
): number {
  if (!jobs.length || !currentJob) return -1;

  return jobs.findIndex((job) => (
    job === currentJob ||
    job.id === currentJob.id ||
    job.custom_id === currentJob.custom_id
  ));
}

export default function ScenarioFrame({ meta, children }: ScenarioFrameProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedJdId = searchParams.get('id');
  const requestedDataset = searchParams.get('dataset');
  const platformStyleEnabled = readBooleanParam(searchParams.get('platform-style'));
  const moreStyleEnabled = readBooleanParam(searchParams.get('more-style'));
  const jd = findJdByScenario(meta.id);
  const [jsonlJobs, setJsonlJobs] = useState<JsonlJobDescription[]>([]);
  const [jsonlDataset, setJsonlDataset] = useState<JsonlDatasetManifestEntry | null>(null);
  const [jsonlError, setJsonlError] = useState<string | null>(null);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  const [isMoreRevealed, setIsMoreRevealed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadJsonlDataset(requestedDataset)
      .then((loaded) => {
        if (!alive) return;
        setJsonlJobs(loaded.jobs);
        setJsonlDataset(loaded.dataset);
        setJsonlError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setJsonlError(err instanceof Error ? err.message : 'Unable to load JSONL jobs.');
      });

    return () => {
      alive = false;
    };
  }, [requestedDataset]);

  const jsonlJob = useMemo(
    () => findJsonlJobById(jsonlJobs, requestedJdId),
    [jsonlJobs, requestedJdId],
  );

  useEffect(() => {
    setIsMoreRevealed(false);
  }, [requestedDataset, requestedJdId, moreStyleEnabled]);

  useEffect(() => {
    startJdRunTimer({
      dataset: requestedDataset,
      jdId: requestedJdId ?? '0',
    });
  }, [requestedDataset, requestedJdId]);

  const canRenderJsonlHtml = Boolean(jsonlJob && (!moreStyleEnabled || isMoreRevealed));
  const sanitizedJsonlHtml = canRenderJsonlHtml && jsonlJob?.html
    ? sanitizeJobHtml(jsonlJob.html)
    : '';
  const previewJsonlHtml = moreStyleEnabled && !isMoreRevealed && jsonlJob?.html
    ? previewJobHtml(jsonlJob.html)
    : '';
  const platformJobs = useMemo(
    () => getPlatformWindowJobs(jsonlJobs, jsonlJob),
    [jsonlJobs, jsonlJob],
  );
  const jsonlJobIndex = useMemo(
    () => getJobIndex(jsonlJobs, jsonlJob),
    [jsonlJobs, jsonlJob],
  );
  const previousJsonlJob = jsonlJobIndex > 0 ? jsonlJobs[jsonlJobIndex - 1] : undefined;
  const nextJsonlJob = jsonlJobIndex >= 0 && jsonlJobIndex < jsonlJobs.length - 1
    ? jsonlJobs[jsonlJobIndex + 1]
    : undefined;
  const isJsonlLoading = jsonlJobs.length === 0 && !jsonlError;
  const jsonlNotFound = Boolean(requestedJdId && jsonlJobs.length > 0 && !jsonlJob);
  const scenarioOptions = useMemo(
    () => [...SCENARIO_META].sort((a, b) => a.level - b.level || a.title.localeCompare(b.title)),
    [],
  );

  const buildJdUrl = (scenarioId: ScenarioId, jobId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('scenarios', scenarioId);
    next.set('id', jobId);
    if (jsonlDataset) next.set('dataset', jsonlDataset.label);
    return `/jd?${next.toString()}`;
  };

  const switchScenario = (scenarioId: ScenarioId) => {
    navigate(buildJdUrl(scenarioId, requestedJdId ?? '0'));
  };

  const setStyleParam = (name: 'platform-style' | 'more-style', value: boolean) => {
    const next = new URLSearchParams(searchParams);
    next.set(name, value ? 'true' : 'false');
    navigate(`/jd?${next.toString()}`);
  };

  const renderJobPager = (position: 'top' | 'bottom') => {
    if (!jsonlJob) return null;

    return (
      <nav data-job-pager={position} aria-label={`Job navigation ${position}`}>
        {previousJsonlJob ? (
          <Link to={buildJdUrl(meta.id, getJobUrlId(previousJsonlJob))} data-job-pager-link="">
            Previous
          </Link>
        ) : (
          <button type="button" data-job-pager-link="" disabled>
            Previous
          </button>
        )}
        {nextJsonlJob ? (
          <Link to={buildJdUrl(meta.id, getJobUrlId(nextJsonlJob))} data-job-pager-link="">
            Next
          </Link>
        ) : (
          <button type="button" data-job-pager-link="" disabled>
            Next
          </button>
        )}
      </nav>
    );
  };

  const renderJsonlJdSection = () => {
    if (!jsonlJob) return null;

    return (
      <section data-section="jd" data-jd-source="jsonl" data-jd-id={jsonlJob.id}>
        <div data-jd-toolbar="">
          <p data-jd-eyebrow="">
            {jsonlDataset?.label ?? 'dataset'} · {jsonlJob.job_level || 'unknown level'}
          </p>
        </div>
        <h1>{jsonlJob.title}</h1>

        {moreStyleEnabled && !isMoreRevealed ? (
          <div data-more-preview="">
            <div
              data-jd-html=""
              data-jd-preview=""
              dangerouslySetInnerHTML={{ __html: previewJsonlHtml }}
            />
            <div data-more-preview-action="">
              <button
                type="button"
                data-more-button=""
                onClick={() => setIsMoreRevealed(true)}
              >
                More
              </button>
            </div>
          </div>
        ) : (
          <div
            data-jd-html=""
            dangerouslySetInnerHTML={{ __html: sanitizedJsonlHtml }}
          />
        )}
      </section>
    );
  };

  return (
    <article
      data-scenario-frame=""
      data-scenario-id={meta.id}
      data-level={meta.level}
      data-platform-style={platformStyleEnabled ? 'true' : 'false'}
      data-more-style={moreStyleEnabled ? 'true' : 'false'}
    >
      <div data-jd-controls="">
        <section
          data-section="styles"
          data-open={isStylesOpen ? 'true' : 'false'}
        >
          <div data-styles-header="">
            <button
              type="button"
              data-styles-summary=""
              aria-expanded={isStylesOpen}
              onClick={() => setIsStylesOpen((open) => !open)}
            >
              Options
            </button>
            <span data-styles-hint="">
              ← Form type and page conditions
            </span>
          </div>
          {isStylesOpen && (
            <>
              <section data-section="style-controls">
                <h2>Page conditions</h2>
                <div data-style-control-row="">
                  <span data-style-label="">Platform layout</span>
                  <span data-style-toggle-group="" role="group" aria-label="Platform layout">
                    <button
                      type="button"
                      data-style-toggle=""
                      data-selected={platformStyleEnabled ? 'false' : 'true'}
                      onClick={() => setStyleParam('platform-style', false)}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      data-style-toggle=""
                      data-selected={platformStyleEnabled ? 'true' : 'false'}
                      onClick={() => setStyleParam('platform-style', true)}
                    >
                      Yes
                    </button>
                  </span>
                </div>
                <div data-style-control-row="">
                  <span data-style-label="">More button</span>
                  <span data-style-toggle-group="" role="group" aria-label="More button">
                    <button
                      type="button"
                      data-style-toggle=""
                      data-selected={moreStyleEnabled ? 'false' : 'true'}
                      onClick={() => setStyleParam('more-style', false)}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      data-style-toggle=""
                      data-selected={moreStyleEnabled ? 'true' : 'false'}
                      onClick={() => setStyleParam('more-style', true)}
                    >
                      Yes
                    </button>
                  </span>
                </div>
              </section>

              <section data-section="scenario-info">
                <div data-scenario-selector-header="">
                  <h2>Form type</h2>
                  <p>Choose the application flow for this JD.</p>
                </div>
                <ul data-scenario-selector="">
                  {scenarioOptions.map((scenario) => (
                    <li key={scenario.id}>
                      <button
                        type="button"
                        data-scenario-option=""
                        data-selected={scenario.id === meta.id ? 'true' : 'false'}
                        onClick={() => switchScenario(scenario.id)}
                      >
                        <span data-scenario-level>Level {scenario.level}</span>
                        <span data-scenario-option-main="">
                          <span data-scenario-option-title="">{scenario.title}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section data-section="expected-fields">
                <h2>Expected fields (for automation operators)</h2>
                <ul>
                  {meta.expectedFields.map((f) => (
                    <li key={f.name}>
                      <code>{f.name}</code> - {f.label}
                      {f.required ? ' (required)' : ''}
                      {f.notes ? `. ${f.notes}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </section>

        {renderJobPager('top')}
      </div>

      {isJsonlLoading ? (
        <section data-section="jd" data-jd-source="jsonl" data-state="loading">
          <p data-jd-eyebrow="">Loading JSONL job descriptions...</p>
        </section>
      ) : jsonlJob ? (
        platformStyleEnabled ? (
          <div data-jd-platform-layout="">
            <aside data-platform-sidebar="" aria-label="Nearby jobs">
              <div data-platform-sidebar-header="">
                <h2>Top job picks for you</h2>
                <p>Nearby rows from {jsonlDataset?.label ?? 'this dataset'}</p>
                <p>{platformJobs.length} shown</p>
              </div>
              <ul data-platform-job-list="">
                {platformJobs.map((job) => {
                  const isCurrent = job.custom_id === jsonlJob.custom_id;
                  return (
                    <li key={job.custom_id} data-current={isCurrent ? 'true' : 'false'}>
                      <Link to={buildJdUrl(meta.id, getJobUrlId(job))} data-platform-job="">
                        <span data-platform-job-body="">
                          <span data-platform-job-title="">{job.title}</span>
                          <span data-platform-job-meta="">
                            {job.job_level || 'unknown level'} · {jsonlDataset?.label ?? 'dataset'}
                          </span>
                          <span data-platform-job-excerpt="">
                            {excerptFromJobHtml(job.html, 86)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </aside>
            {renderJsonlJdSection()}
          </div>
        ) : (
          renderJsonlJdSection()
        )
      ) : jsonlNotFound ? (
        <section data-section="jd" data-jd-source="jsonl" data-state="not-found">
          <p data-jsonl-error="">
            JSONL JD id <code>{requestedJdId}</code> was not found.
          </p>
        </section>
      ) : jd ? (
        <section data-section="jd" data-jd-id={jd.id}>
          <p data-jd-eyebrow="">{jd.companyName} · {jd.location}</p>
          <h1>{jd.title}</h1>
          <dl data-jd-meta>
            <dt>Department</dt>
            <dd>{jd.department}</dd>
            <dt>Employment</dt>
            <dd>{jd.employmentType}</dd>
            <dt>Experience</dt>
            <dd>{jd.experienceLevel}</dd>
            <dt>Education</dt>
            <dd>{jd.educationLevel}</dd>
            <dt>Industry</dt>
            <dd>{jd.industry}</dd>
            <dt>Function</dt>
            <dd>{jd.function}</dd>
            {jd.salaryRange && (
              <>
                <dt>Salary</dt>
                <dd>{jd.salaryRange}</dd>
              </>
            )}
          </dl>

          {jd.responsibilities.length > 0 && (
            <>
              <h2>Responsibilities</h2>
              <ul data-jd-list="responsibilities">
                {jd.responsibilities.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </>
          )}

          {jd.requirements.length > 0 && (
            <>
              <h2>Requirements</h2>
              <ul data-jd-list="requirements">
                {jd.requirements.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </>
          )}

          {jd.benefits.length > 0 && (
            <>
              <h2>Benefits</h2>
              <ul data-jd-list="benefits">
                {jd.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <section data-section="job-context">
          <h1>{meta.job.title}</h1>
          <p data-jd-eyebrow="">{meta.job.team} · {meta.job.location}</p>
          <p>{meta.job.summary}</p>
        </section>
      )}

      {renderJobPager('bottom')}

      {!jsonlJob && !jsonlNotFound && !jd && jsonlError && (
        <p data-jsonl-error="">JSONL JD failed to load: {jsonlError}</p>
      )}

      <section data-section="scenario-form">
        <h2>Apply for this role</h2>
        {children}
      </section>
    </article>
  );
}
