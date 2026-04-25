import { Link, useParams } from 'react-router-dom';
import { findType } from '../data/types';
import { scenariosByType } from '../data/scenarios';

export default function TypePage() {
  const { typeId } = useParams();
  const type = typeId ? findType(typeId) : undefined;

  if (!type) {
    return (
      <section data-page="type-not-found">
        <h1>Unknown type: {typeId}</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    );
  }

  const scenarios = scenariosByType(type.id);

  return (
    <section data-page="type" data-type-id={type.id}>
      <p>
        <Link to="/">← Home</Link>
      </p>
      <h1>{type.title}</h1>
      <p>{type.shortDescription}</p>
      <p>{type.notes}</p>

      <h2>Scenarios</h2>
      {scenarios.length === 0 ? (
        <p>No scenarios defined yet.</p>
      ) : (
        <ul data-section="scenario-list">
          {scenarios.map((s) => (
            <li key={s.id} data-scenario-id={s.id} data-level={s.level}>
              <Link to={`/scenarios/${s.id}`}>{s.title}</Link>
              <span> — Level {s.level}.</span>
              <span> {s.description}</span>
              {s.difficultyTags.length > 0 && (
                <span data-tags=""> Tags: {s.difficultyTags.join(', ')}.</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
