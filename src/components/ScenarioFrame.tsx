import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ScenarioMeta } from '../types/scenario';
import { findJdByScenario } from '../data/jds';

interface ScenarioFrameProps {
  meta: ScenarioMeta;
  children: ReactNode;
}

export default function ScenarioFrame({ meta, children }: ScenarioFrameProps) {
  const jd = findJdByScenario(meta.id);

  return (
    <article data-scenario-frame="" data-scenario-id={meta.id} data-level={meta.level}>
      <p data-breadcrumb="">
        <Link to="/">Home</Link> / <Link to={`/types/${meta.typeId}`}>{meta.typeId}</Link> /{' '}
        <span>{meta.id}</span>
      </p>

      {jd ? (
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

      <section data-section="scenario-info">
        <p>
          <span data-scenario-level>Level {meta.level}</span>
          <span data-scenario-id-pill data-id={meta.id}>{meta.id}</span>
        </p>
        <p data-scenario-description="">{meta.description}</p>
      </section>

      <section data-section="scenario-form">
        <h2>Apply for this role</h2>
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
