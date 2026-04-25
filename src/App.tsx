import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div data-app="applyground">
      <header data-app-header>
        <p>
          <Link to="/">Applyground</Link>
        </p>
      </header>
      <main data-app-main>
        <Outlet />
      </main>
      <footer data-app-footer>
        <p>
          Applyground is a neutral, original fixture set for job-application form automation.
          It does not replicate any real brand, ATS, or platform. No backend; submissions are
          local-only and echoed back as JSON.
        </p>
      </footer>
    </div>
  );
}
