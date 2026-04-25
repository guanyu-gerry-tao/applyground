import { Link } from 'react-router-dom';
import { APPLICATION_TYPES } from '../data/types';

export default function Home() {
  return (
    <section data-page="home">
      <h1>Applyground</h1>
      <p>
        A static playground for testing job application form automation. Each entry below is a
        category of fake application page. Pick a category to see its cases.
      </p>
      <p>
        Submissions are local-only. No backend. No real branding. File uploads record metadata only.
      </p>

      <h2>Application page types</h2>
      <ul data-section="type-index">
        {APPLICATION_TYPES.map((t) => (
          <li key={t.id} data-type-id={t.id}>
            <Link to={`/types/${t.id}`}>{t.title}</Link>
            <span> — {t.shortDescription}</span>
          </li>
        ))}
      </ul>

      <h2>Stable links for automation</h2>
      <ul>
        <li>
          <code>/</code> — this index.
        </li>
        <li>
          <code>/types/:typeId</code> — list of scenarios within a type.
        </li>
        <li>
          <code>/scenarios/:scenarioId</code> — a fake application page.
        </li>
        <li>
          <code>/confirmation/:scenarioId</code> — JSON echo of the most recent submission.
        </li>
      </ul>
    </section>
  );
}
