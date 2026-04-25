import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ScenarioMeta } from '../types/scenario';

interface ScenarioFrameProps {
  meta: ScenarioMeta;
  children: ReactNode;
}

export default function ScenarioFrame({ meta, children }: ScenarioFrameProps) {
  return (
    <article data-scenario-frame="" data-scenario-id={meta.id} data-level={meta.level}>
      <p>
        <Link to="/">Home</Link> / <Link to={`/types/${meta.typeId}`}>{meta.typeId}</Link> /{' '}
        <span>{meta.id}</span>
      </p>

      <header data-scenario-header="">
        <h1>{meta.title}</h1>
        <p data-scenario-level="">Level {meta.level}.</p>
        <p>{meta.description}</p>
      </header>

      <section data-section="job-context">
        <h2>Job context</h2>
        <dl>
          <dt>Title</dt>
          <dd>{meta.job.title}</dd>
          <dt>Team</dt>
          <dd>{meta.job.team}</dd>
          <dt>Location</dt>
          <dd>{meta.job.location}</dd>
          <dt>Type</dt>
          <dd>{meta.job.employmentType}</dd>
          <dt>Summary</dt>
          <dd>{meta.job.summary}</dd>
        </dl>
      </section>

      <section data-section="scenario-form">
        <h2>Application form</h2>
        {children}
      </section>

      <section data-section="expected-fields">
        <h2>Expected fields (for automation operators)</h2>
        <ul>
          {meta.expectedFields.map((f) => (
            <li key={f.name}>
              <code>{f.name}</code> — {f.label}
              {f.required ? ' (required)' : ''}
              {f.notes ? `. ${f.notes}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
