import { useParams } from 'react-router-dom';

export default function ScenarioPage() {
  const { scenarioId } = useParams();
  return (
    <section data-page="scenario">
      <h1>Scenario: {scenarioId}</h1>
      <p>Placeholder. Real scenarios land in commits 5–9.</p>
    </section>
  );
}
