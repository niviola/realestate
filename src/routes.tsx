import Home from './pages/Home';
import About from './pages/About';
import Listings from './pages/Listings';
import Contact from './pages/Contact';

export const routes = [
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/listings', element: <Listings /> },
  { path: '/contact', element: <Contact /> },
];