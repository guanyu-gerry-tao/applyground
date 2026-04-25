import { useParams } from 'react-router-dom';

export default function ConfirmationPage() {
  const { scenarioId } = useParams();
  return (
    <section data-page="confirmation">
      <h1>Confirmation: {scenarioId}</h1>
      <p>Placeholder. JSON echo + download lands in commit 4.</p>
    </section>
  );
}
