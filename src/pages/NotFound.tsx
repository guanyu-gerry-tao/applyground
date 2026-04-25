import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section data-page="not-found">
      <h1>Not found</h1>
      <p>
        No page matches this URL. <Link to="/">Back to home</Link>.
      </p>
    </section>
  );
}
