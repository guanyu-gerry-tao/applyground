import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  excerptFromJobHtml,
  loadDatasetManifest,
  loadJsonlDataset,
  type JsonlDatasetManifestEntry,
  type JsonlJobDescription,
} from '../data/jsonlJobs';

const DEFAULT_SCENARIO_ID = 'simple-company-form';
const PAGE_SIZE = 50;

interface JobRowProps {
  job: JsonlJobDescription;
  index: number;
  datasetLabel: string;
}

function JobRow({ job, index, datasetLabel }: JobRowProps) {
  const jobRouteId = job.id ?? job.custom_id;
  const jobSearch = new URLSearchParams({
    scenarios: DEFAULT_SCENARIO_ID,
    id: String(jobRouteId),
    dataset: datasetLabel,
  });

  return (
    <li data-job-row="" data-job-id={jobRouteId} data-level={job.job_level}>
      <Link to={`/jd?${jobSearch.toString()}`} data-job-row-link="">
        <div>
          <div data-job-title-row="">
            <span data-job-index="">{index}.</span>
            <span data-job-title="">{job.title}</span>
            <p data-job-meta="">
              <span>{job.job_level || 'unknown level'}</span>
              <span>{datasetLabel}</span>
            </p>
          </div>
        </div>
        <p data-job-excerpt="">{excerptFromJobHtml(job.html)}</p>
      </Link>
    </li>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JsonlJobDescription[]>([]);
  const [datasets, setDatasets] = useState<JsonlDatasetManifestEntry[]>([]);
  const [activeDataset, setActiveDataset] = useState<JsonlDatasetManifestEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const selectedLevel = searchParams.get('level') ?? 'all';
  const selectedDataset = searchParams.get('dataset') ?? datasets[0]?.label ?? '';

  const levelOptions = useMemo(() => (
    Array.from(new Set(jobs.map((job) => job.job_level || 'unknown'))).sort()
  ), [jobs]);

  const filteredJobs = useMemo(() => (
    jobs.filter((job) => selectedLevel === 'all' || (job.job_level || 'unknown') === selectedLevel)
  ), [jobs, selectedLevel]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    let alive = true;
    loadDatasetManifest()
      .then((loadedDatasets) => {
        if (!alive) return;
        setDatasets(loadedDatasets);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Unable to load dataset manifest.');
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDataset) return;

    let alive = true;
    loadJsonlDataset(selectedDataset)
      .then((loaded) => {
        if (!alive) return;
        setJobs(loaded.jobs);
        setActiveDataset(loaded.dataset);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Unable to load JSONL jobs.');
      });

    return () => {
      alive = false;
    };
  }, [selectedDataset]);

  const visibleJobs = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, safePage]);

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const setFilter = (key: 'level' | 'dataset', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'level' && value === 'all') next.delete(key);
    else if (key === 'dataset' && value === datasets[0]?.label) next.delete(key);
    else next.set(key, value);
    next.set('page', '1');
    setSearchParams(next);
  };

  const datasetLabel = activeDataset?.label ?? selectedDataset;
  const visibleStart = filteredJobs.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const visibleEnd = Math.min(safePage * PAGE_SIZE, filteredJobs.length);
  const indexStatus = jobs.length === 0
    ? 'Loading dataset'
    : `${visibleStart}-${visibleEnd} of ${filteredJobs.length}${
      filteredJobs.length !== jobs.length ? ` filtered from ${jobs.length}` : ''
    }`;

  return (
    <section data-page="home">
      <section data-section="home-overview">
        <div data-home-intro="">
          <h1>Application Practice Ground</h1>
          <p>
            Static job posts and form scenarios for checking how AI agents read, navigate,
            and return local-only JSON results.
          </p>
          <p data-home-privacy-note="">
            Applyground is fully frontend-only: there is no backend logging, privacy tracking, or
            server-side persistence. Job descriptions come from open-source web resources on
            Hugging Face and have been de-identified before inclusion. Still, do not use real
            personal information when testing.
          </p>
        </div>
      </section>

      <section data-section="job-index-controls" aria-label="Job index controls">
        <div data-job-index-status="">
          <span data-toolbar-label="">Index</span>
          <span data-toolbar-value="">
            <code>{datasetLabel || 'loading'}</code> · {indexStatus} · Static-only JSON echo
          </span>
        </div>
        <div data-job-filters="" aria-label="Job index filters">
          <label>
            <span>Level</span>
            <select
              value={selectedLevel}
              onChange={(event) => setFilter('level', event.target.value)}
            >
              <option value="all">All levels</option>
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Dataset</span>
            <select
              value={selectedDataset}
              onChange={(event) => setFilter('dataset', event.target.value)}
            >
              {datasets.map((dataset) => (
                <option key={dataset.label} value={dataset.label}>
                  {dataset.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && <p data-jsonl-error="">JSONL jobs failed to load: {error}</p>}
      {!error && jobs.length === 0 && <p data-jobs-loading="">Loading JSONL jobs...</p>}

      <ol data-section="job-index" start={(safePage - 1) * PAGE_SIZE + 1}>
        {visibleJobs.map((job, index) => (
          <JobRow
            key={job.custom_id}
            job={job}
            index={(safePage - 1) * PAGE_SIZE + index + 1}
            datasetLabel={datasetLabel}
          />
        ))}
      </ol>

      <nav data-section="pagination" aria-label="Job pages">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => setPage(safePage - 1)}
        >
          Previous
        </button>
        <span>
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => setPage(safePage + 1)}
        >
          Next
        </button>
      </nav>

      <h2>Stable links for automation</h2>
      <ul>
        <li>
          <code>/</code> — paginated JD index.
        </li>
        <li>
          <code>/types/:typeId</code> — legacy list of scenarios within a type.
        </li>
        <li>
          <code>/jd?scenarios=:scenarioId&amp;id=:jsonlJobId&amp;dataset=:label</code> — application page for one JD and
          one form type.
        </li>
        <li>
          <code>/score/:scenarioId?sec=:seconds;filled=:percent;id=:jsonlJobId</code> — local
          scoring result after submit.
        </li>
      </ul>
    </section>
  );
}
