import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout() {
    const location = useLocation();

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500/30">
            <Navbar />
            <main className="flex-1 flex flex-col">
                <Outlet />
            </main>
            {location.pathname !== '/' && <Footer />}
        </div>
    );
}
