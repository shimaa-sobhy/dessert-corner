import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import BackToTop from './BackToTop';

export default function Layout() {
  return (
    <div className="page">
      <ScrollToTop />
      <BackToTop />
      <Navbar />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
