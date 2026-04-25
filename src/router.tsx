import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import TypePage from './pages/TypePage';
import ScenarioPage from './pages/ScenarioPage';
import ConfirmationPage from './pages/ConfirmationPage';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'types/:typeId', element: <TypePage /> },
      { path: 'scenarios/:scenarioId', element: <ScenarioPage /> },
      { path: 'confirmation/:scenarioId', element: <ConfirmationPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
