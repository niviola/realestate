import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { routes } from './routes';
import ListingDetail from './pages/ListingDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminListings from './pages/admin/AdminListings';
import AdminListingEdit from './pages/admin/AdminListingEdit';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminPage from './pages/admin/AdminPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
        <Route path="/admin/listings" element={<AdminListings />} />
        <Route path="/admin/listings/:id" element={<AdminListingEdit />} />
        <Route path="/admin/inquiries" element={<AdminInquiries />} />
        </Route>
        <Route path="/admin/pages" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;