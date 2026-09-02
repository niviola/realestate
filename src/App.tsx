import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { routes } from './routes';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </>
  );
}

export default App;