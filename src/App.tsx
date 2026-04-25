import { Link, Outlet } from 'react-router-dom';

const REPO_URL = 'https://github.com/guanyu-gerry-tao/applyground';

export default function App() {
  return (
    <div data-app="applyground">
      <header data-app-header>
        <div data-app-header-row>
          <p data-app-brand>
            <Link to="/">Applyground</Link>
            <span data-app-tagline> — neutral fixtures for job-application form automation.</span>
          </p>
          <a
            data-app-star-link
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star Applyground on GitHub"
          >
            <span data-star-icon aria-hidden="true">★</span>
            <span> Star on GitHub</span>
          </a>
        </div>
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
        <p>
          Open source under MIT.{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Star us on GitHub
          </a>{' '}
          if this saves you time — it helps other automation builders find the project.
        </p>
      </footer>
    </div>
  );
}
