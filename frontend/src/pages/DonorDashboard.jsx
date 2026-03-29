import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DonorDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [profile,    setProfile]    = useState(null);
  const [screening,  setScreening]  = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [donatingId, setDonatingId] = useState(null);
  const [donatedIds, setDonatedIds] = useState([]);
  const [donateError, setDonateError] = useState('');

  const handleDonate = async (bloodBankId) => {
    setDonatingId(bloodBankId);
    setDonateError('');
    try {
      const res = await fetch('http://localhost:5000/api/donors/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ blood_bank_id: bloodBankId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDonateError(data.error || 'Donation failed. Try again.');
        return;
      }
      setDonatedIds(prev => [...prev, bloodBankId]);
    } catch {
      setDonateError('Server error. Please try again.');
    } finally {
      setDonatingId(null);
    }
  };

  useEffect(() => {
    if (!auth) { navigate('/login'); return; }
    const H = { Authorization: `Bearer ${auth.token}` };

    Promise.all([
      fetch('http://localhost:5000/api/donors/me',    { headers: H }).then(r => r.json()),
      fetch('http://localhost:5000/api/screening/me', { headers: H }).then(r => r.json()),
    ]).then(async ([profileData, screeningData]) => {
      if (profileData.error) { setError('Could not load profile.'); return; }
      setProfile(profileData);
      setScreening(Array.isArray(screeningData) ? screeningData : []);

      const city = auth.user.city;
      const bbRes = await fetch(
        `http://localhost:5000/api/blood-banks?city=${encodeURIComponent(city)}`,
        { headers: H }
      );
      const bbData = await bbRes.json();
      setBloodBanks(Array.isArray(bbData) ? bbData : []);
    }).catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const latest     = screening[0];
  const isEligible = latest?.status === 'PASSED';

  if (loading) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        <p className="text-red-500 font-medium text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 rounded-full p-1.5">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="font-extrabold text-red-600 text-lg tracking-tight">BloodDonate</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">{auth?.user?.name}</span>
              <span className="text-xs text-gray-400">{auth?.user?.city}</span>
            </div>
            <button onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-white hover:bg-red-600
                         border border-red-200 hover:border-red-600 px-3 py-1.5 rounded-lg transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* General error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* ── Eligibility Banner ── */}
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${
          isEligible ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <div className={`rounded-full p-3 ${isEligible ? 'bg-green-100' : 'bg-orange-100'}`}>
            {isEligible ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
              </svg>
            )}
          </div>
          <div>
            <p className={`font-semibold ${isEligible ? 'text-green-700' : 'text-orange-600'}`}>
              {isEligible ? '✅ You are eligible to donate blood!' : '⚠️ Not eligible at this time'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {latest
                ? `Last screened on ${new Date(latest.screening_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — Status: ${latest.status}`
                : 'No screening record found'}
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Blood Group',  value: profile?.blood_group || '—',                          icon: '🩸' },
            { label: 'Your City',    value: auth?.user?.city     || '—',                          icon: '📍' },
            { label: 'Hemoglobin',   value: latest ? `${latest.hemoglobin_level} g/dL` : '—',    icon: '💉' },
            { label: 'Nearby Banks', value: bloodBanks.length,                                    icon: '🏥' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xl font-extrabold text-gray-800">{card.value}</span>
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
          ))}
        </div>

        {/* ── Blood Banks Near You ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            🏥 Blood Banks in {auth?.user?.city}
          </h2>

          {/* Donate error shown above the grid */}
          {donateError && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <span>⚠️</span> {donateError}
            </div>
          )}

          {bloodBanks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No blood banks registered in {auth?.user?.city} yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {bloodBanks.map(bb => {
                const isDonating = donatingId === bb.id;
                const donated    = donatedIds.includes(bb.id);

                return (
                  <div key={bb.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                               hover:border-red-300 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{bb.name}</h3>
                        {bb.address_line && (
                          <p className="text-sm text-gray-500 mt-0.5">{bb.address_line}</p>
                        )}
                        <p className="text-sm text-gray-400">{bb.city}, {bb.state} {bb.pincode}</p>
                      </div>
                      <span className="shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Active
                      </span>
                    </div>

                    {bb.contact_number && (
                      <a href={`tel:${bb.contact_number}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800">
                        📞 {bb.contact_number}
                      </a>
                    )}

                    {/* ── Donate Button ── */}
                    <button
                      onClick={() => handleDonate(bb.id)}
                      disabled={!isEligible || isDonating || donated}
                      className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                        ${donated
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : !isEligible
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isDonating
                          ? 'bg-red-300 text-white cursor-wait'
                          : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                        }`}
                    >
                      {donated ? '✅ Donation Recorded' : isDonating ? 'Processing...' : '🩸 Donate Now'}
                    </button>

                    {!isEligible && (
                      <p className="text-xs text-center text-gray-400 mt-1">
                        You must pass screening to donate
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Screening History ── */}
        {screening.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">📋 Screening History</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    {['Date', 'Hemoglobin', 'Blood Pressure', 'Weight', 'Status', 'Remarks'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {screening.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(s.screening_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">{s.hemoglobin_level} g/dL</td>
                      <td className="px-4 py-3">{s.blood_pressure || '—'}</td>
                      <td className="px-4 py-3">{s.weight ? `${s.weight} kg` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                          s.status === 'FAILED' ? 'bg-red-100 text-red-600'    :
                                                  'bg-yellow-100 text-yellow-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{s.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}