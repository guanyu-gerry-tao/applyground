import { useParams } from 'react-router-dom';

export default function TypePage() {
  const { typeId } = useParams();
  return (
    <section data-page="type">
      <h1>Type: {typeId}</h1>
      <p>Placeholder. The real scenario list per type lands in commit 3.</p>
    </section>
  );
}
