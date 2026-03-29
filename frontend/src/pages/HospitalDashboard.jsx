import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HospitalDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { navigate('/login'); return; }
    fetch('http://localhost:5000/api/hospitals/me', {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.json())
      .then(data => setProfile(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 rounded-full p-1.5">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="font-extrabold text-red-600 text-lg">BloodDonate</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-800 hidden sm:block">
              {profile?.hospital_name || auth?.user?.name}
            </span>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm font-medium text-red-600 border border-red-200 hover:bg-red-600
                         hover:text-white hover:border-red-600 px-3 py-1.5 rounded-lg transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 rounded-full p-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">
                {profile?.hospital_name || 'Hospital Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {profile?.city}, {profile?.state} — {profile?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Hospital Name',   value: profile?.hospital_name  || '—', icon: '🏥' },
            { label: 'License',         value: profile?.license_number || 'N/A', icon: '📄' },
            { label: 'City',            value: profile?.city           || '—', icon: '📍' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <span className="text-2xl">{card.icon}</span>
              <p className="text-base font-bold text-gray-800 mt-1 break-words">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Placeholder for future features */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-dashed border-gray-200 text-center">
          <p className="text-4xl mb-3">🩺</p>
          <h3 className="font-semibold text-gray-700">Blood Request Management</h3>
          <p className="text-sm text-gray-400 mt-1">
            Coming soon — request blood units, track inventory, and manage donations.
          </p>
        </div>
      </main>
    </div>
  );
}