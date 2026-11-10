import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './lib/auth';
import { SettingsProvider } from './lib/settings';
import { configured } from './lib/supabase';
import { TabBar, TopBar } from './components/Chrome';
import { RequireRole } from './components/Guard';
import Browse from './pages/Browse';
import CompanyProfile from './pages/CompanyProfile';
import Waitlist from './pages/Waitlist';
import ForCompanies from './pages/ForCompanies';
import SignIn from './pages/SignIn';
import Account from './pages/Account';
import Apply from './pages/Apply';
import ComingSoon from './pages/ComingSoon';
import { CompanyHome, CompanyProfileEdit } from './pages/Dashboard';
import Approvals from './pages/admin/Approvals';
import Companies from './pages/admin/Companies';
import WaitlistAdmin from './pages/admin/WaitlistAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ScrollTop />
          <TopBar />
          {!configured && <p className="notice config">Supabase isn’t connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify’s environment variables, then redeploy.</p>}
          <main>
            <Routes>
              <Route path="/" element={<Browse />} />
              <Route path="/company/:id" element={<CompanyProfile />} />
              <Route path="/specials" element={<ComingSoon title="Specials" text="Deals from MeritWorx companies will show here once we launch to homeowners." />} />
              <Route path="/requests" element={<ComingSoon title="Your requests" text="Request quotes and track them here once booking opens." />} />
              <Route path="/payments" element={<ComingSoon title="Payments" text="Pay your pro from your phone with Apple Pay, Google Pay, card, or bank once payments go live." />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/for-companies" element={<ForCompanies />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/account" element={<Account />} />
              <Route path="/apply/:token" element={<Apply />} />

              <Route path="/dashboard" element={<RequireRole role="company"><CompanyHome /></RequireRole>} />
              <Route path="/dashboard/profile" element={<RequireRole role="company"><CompanyProfileEdit /></RequireRole>} />
              <Route path="/dashboard/requests" element={<RequireRole role="company"><ComingSoon waitlist={false} title="Quote requests" text="Homeowners’ quote requests land here when booking opens. You’ll get a text for each new one." /></RequireRole>} />
              <Route path="/dashboard/get-paid" element={<RequireRole role="company"><ComingSoon waitlist={false} title="Get paid" text="Send bills and take payment at the door here once in-app payments go live. You’ll set up payouts first." /></RequireRole>} />

              <Route path="/admin" element={<RequireRole role="admin"><Approvals /></RequireRole>} />
              <Route path="/admin/companies" element={<RequireRole role="admin"><Companies /></RequireRole>} />
              <Route path="/admin/waitlist" element={<RequireRole role="admin"><WaitlistAdmin /></RequireRole>} />
              <Route path="/admin/settings" element={<RequireRole role="admin"><SettingsAdmin /></RequireRole>} />
              <Route path="*" element={<ComingSoon waitlist={false} title="Page not found" text="That link doesn’t go anywhere. Use the tabs below to find your way." />} />
            </Routes>
          </main>
          <TabBar />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
