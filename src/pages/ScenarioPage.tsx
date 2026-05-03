import { Link, useParams, useSearchParams } from 'react-router-dom';
import { findScenarioMeta } from '../data/scenarios';
import { SCENARIO_COMPONENTS } from '../scenarios/registry';
import GenericFallbackScenario from '../scenarios/GenericFallbackScenario';

export default function ScenarioPage() {
  const { scenarioId } = useParams();
  const [searchParams] = useSearchParams();
  const queryScenarioId = searchParams.get('scenarios') ?? searchParams.get('scenario');
  const resolvedScenarioId = scenarioId ?? queryScenarioId ?? undefined;
  const meta = resolvedScenarioId ? findScenarioMeta(resolvedScenarioId) : undefined;

  if (!meta) {
    return (
      <section data-page="scenario-not-found">
        <h1>Unknown scenario: {resolvedScenarioId}</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    );
  }

  const Component = SCENARIO_COMPONENTS[meta.id];
  if (Component) {
    return <Component />;
  }

  return <GenericFallbackScenario meta={meta} />;
}
