import { Link, useParams } from 'react-router-dom';
import { findScenarioMeta } from '../data/scenarios';
import { SCENARIO_COMPONENTS } from '../scenarios/registry';
import GenericFallbackScenario from '../scenarios/GenericFallbackScenario';

export default function ScenarioPage() {
  const { scenarioId } = useParams();
  const meta = scenarioId ? findScenarioMeta(scenarioId) : undefined;

  if (!meta) {
    return (
      <section data-page="scenario-not-found">
        <h1>Unknown scenario: {scenarioId}</h1>
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
