import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Scroll to top on navigation; restore position on back/forward */}
      <ScrollRestoration />
    </div>
  );
}
