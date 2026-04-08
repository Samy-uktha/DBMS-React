import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DonorDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [profile,         setProfile]         = useState(null);
  const [screening,       setScreening]        = useState([]);
  const [nearbyBanks,     setNearbyBanks]      = useState([]);
  const [eligibility,     setEligibility]      = useState(null);
  const [donationHistory, setDonationHistory]  = useState([]);
  const [loading,         setLoading]          = useState(true);
  const [error,           setError]            = useState('');
  const [donatingId,      setDonatingId]       = useState(null);
  const [donatedBankId,   setDonatedBankId]    = useState(null);
  const [donateError,     setDonateError]      = useState('');
  const [units,           setUnits]            = useState({});

  const fetchDashboardData = async () => {
    if (!auth) { navigate('/login'); return; }
    const H = { Authorization: `Bearer ${auth.token}` };

    try {
      const [profileData, screeningData, eligData, historyData] = await Promise.all([
        fetch('http://localhost:5000/api/donors/me',               { headers: H }).then(r => r.json()),
        fetch('http://localhost:5000/api/screening/me',            { headers: H }).then(r => r.json()),
        fetch('http://localhost:5000/api/donors/eligibility',      { headers: H }).then(r => r.json()),
        fetch('http://localhost:5000/api/donors/donation-history', { headers: H }).then(r => r.json()),
      ]);

      if (profileData.error) { setError('Could not load profile.'); return; }
      setProfile(profileData);
      setScreening(Array.isArray(screeningData) ? screeningData : []);
      setEligibility(eligData);
      setDonationHistory(Array.isArray(historyData) ? historyData : []);

      if (eligData.eligibility_status === 'DONATION_TOO_RECENT') {
        const lastDate = new Date(eligData.last_donation_date);
        const today    = new Date();
        const isToday  =
          lastDate.getFullYear() === today.getFullYear() &&
          lastDate.getMonth()    === today.getMonth()    &&
          lastDate.getDate()     === today.getDate();
        if (isToday) setDonatedBankId(eligData.last_donated_bank_id || 'DONATED_TODAY');
      }

      const nearbyData = await fetch('http://localhost:5000/api/blood-banks/nearby', { headers: H }).then(r => r.json());
      setNearbyBanks(Array.isArray(nearbyData) ? nearbyData : []);

    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleDonate = async (bloodBankId) => {
    setDonatingId(bloodBankId);
    setDonateError('');
    const selectedUnits = units[bloodBankId] !== undefined ? units[bloodBankId] : 3;
    try {
      const res = await fetch('http://localhost:5000/api/donors/donate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body:    JSON.stringify({ blood_bank_id: bloodBankId, units_collected: selectedUnits }),
      });
      const data = await res.json();
      if (!res.ok) { setDonateError(data.error || 'Donation failed. Try again.'); return; }

      setDonatedBankId(bloodBankId);

      const historyData = await fetch(
        'http://localhost:5000/api/donors/donation-history',
        { headers: { Authorization: `Bearer ${auth.token}` } }
      ).then(r => r.json());

      setDonationHistory(Array.isArray(historyData) ? historyData : []);

    } catch {
      setDonateError('Server error. Please try again.');
    } finally {
      setDonatingId(null);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const latest     = screening[0];
  const status     = eligibility?.eligibility_status;
  const isEligible = status === 'ELIGIBLE';
  const needsScreening = status === 'NO_SCREENING' || status === 'SCREENING_EXPIRED';
  const isIneligible   = status === 'SCREENING_FAILED' || status === 'DONATION_TOO_RECENT';

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const eligibleAfter = () => {
    if (eligibility?.eligible_after) return fmt(eligibility.eligible_after);
    if (!eligibility?.last_donation_date) return '—';
    const d = new Date(eligibility.last_donation_date);
    d.setDate(d.getDate() + 90);
    return fmt(d);
  };

  const BloodBankCard = ({ bb }) => {
    const isDonating = donatingId === bb.id;
    const isDonated  = donatedBankId === bb.id;
    const isLocked   = donatedBankId !== null && donatedBankId !== bb.id;
    const unitCount  = units[bb.id] ?? 3;

    return (
      <div className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col gap-4
        ${isLocked
          ? 'opacity-40 border-gray-100'
          : 'border-gray-100 hover:border-red-200 hover:shadow-md shadow-sm'}`}>

        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base leading-tight truncate">{bb.name}</h3>
            {bb.address_line && (
              <p className="text-sm text-gray-500 mt-1 leading-snug">{bb.address_line}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{bb.city}, {bb.state} {bb.pincode}</p>
          </div>
          <span className="shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-50" />

        {/* Footer: contact + action */}
        <div className="flex flex-col gap-3">
          {bb.contact_number && (
            <a href={`tel:${bb.contact_number}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 w-fit">
              📞 {bb.contact_number}
            </a>
          )}

          {isDonated && (
            <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-green-100 text-green-700">
              ✅ Donation Recorded
            </div>
          )}

          {isLocked && (
            <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-gray-100 text-gray-400">
              🔒 Already donated today
            </div>
          )}

          {isEligible && !isDonated && !isLocked && (
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-medium">Units</label>
                <select
                  value={unitCount}
                  onChange={e => setUnits(prev => ({ ...prev, [bb.id]: parseInt(e.target.value) }))}
                  disabled={isDonating}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-300 transition">
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} unit{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleDonate(bb.id)}
                disabled={isDonating}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${isDonating
                    ? 'bg-red-300 text-white cursor-wait'
                    : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white'}`}>
                {isDonating ? 'Processing...' : '🩸 Donate Now'}
              </button>
            </div>
          )}

          {needsScreening && !isDonated && !isLocked && (
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2 opacity-40 pointer-events-none select-none">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Units</label>
                  <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-400 w-24">3 units</div>
                </div>
                <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center bg-gray-200 text-gray-400">
                  🩸 Donate Now
                </div>
              </div>
              <button
                onClick={() => navigate('/screening')}
                className="w-full py-2 rounded-xl text-xs font-semibold text-center bg-yellow-50 border border-yellow-300 text-yellow-700 hover:bg-yellow-100 transition-colors">
                {status === 'NO_SCREENING'
                  ? '📋 Complete screening to enable donation'
                  : '🔁 Update expired screening to enable donation'}
              </button>
            </div>
          )}

          {isIneligible && !isDonated && !isLocked && (
            <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-gray-100 text-gray-400">
              🩸 Donate Now
              <span className="block text-xs font-normal mt-0.5">
                {status === 'DONATION_TOO_RECENT'
                  ? `Eligible again after ${eligibleAfter()}`
                  : 'Screening criteria not met'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

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
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-red-600 rounded-full p-1.5">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="font-extrabold text-red-600 text-lg tracking-tight">BloodDonate</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-gray-800">{auth?.user?.name}</span>
              <span className="text-xs text-gray-400">{auth?.user?.city}</span>
            </div>
            <button onClick={handleLogout}
              className="text-sm font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-3.5 py-1.5 rounded-lg transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 space-y-10">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* ── Eligibility / Status Banner ── */}
        {status && status !== 'ELIGIBLE' && (() => {
          const config = {
            NO_SCREENING: {
              bg: 'bg-yellow-50 border-yellow-200', iconBg: 'bg-yellow-100', icon: '📋',
              title: 'Health Screening Required',
              msg: "You haven't filled your health screening yet.",
              btn: 'Complete Screening →', onBtn: () => navigate('/screening'),
            },
            SCREENING_EXPIRED: {
              bg: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100', icon: '🔁',
              title: 'Screening Details Expired',
              msg: `Your screening from ${fmt(eligibility?.latest_screening_date)} is older than 2 months.`,
              btn: 'Update Screening →', onBtn: () => navigate('/screening'),
            },
            SCREENING_FAILED: {
              bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100', icon: '❌',
              title: 'Not Eligible to Donate',
              msg: 'Your screening results did not meet criteria. Please consult a doctor.',
              btn: null, onBtn: null,
            },
            DONATION_TOO_RECENT: {
              bg: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100', icon: '⏳',
              title: 'Too Soon Since Last Donation',
              msg: `Last donation: ${fmt(eligibility?.last_donation_date)}. Eligible again after ${eligibleAfter()}.`,
              btn: null, onBtn: null,
            },
          };
          const c = config[status];
          if (!c) return null;
          return (
            <div className={`${c.bg} border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
              <div className="flex items-start gap-3">
                <div className={`${c.iconBg} rounded-full p-2.5 shrink-0 text-base leading-none`}>{c.icon}</div>
                <div>
                  <p className="font-bold text-gray-800">{c.title}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{c.msg}</p>
                </div>
              </div>
              {c.btn && (
                <button onClick={c.onBtn}
                  className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
                  {c.btn}
                </button>
              )}
            </div>
          );
        })()}

        {/* ── Eligible Banner ── */}
        {isEligible && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-2.5 shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-700 text-sm">You are eligible to donate blood</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Last screened on {fmt(latest?.screening_date)} · Status: {latest?.status}
              </p>
            </div>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Blood Group',    value: profile?.blood_group || '—', icon: '🩸', accent: 'text-red-600'  },
            { label: 'Weight',           value: latest?.weight    || '—', icon: '⚖️', accent: 'text-gray-700' },
            { label: 'Haemoglobin',     value: latest ? `${latest.hemoglobin_level} g/dL` : '—', icon: '💉', accent: 'text-gray-700' },
            { label: 'Blood Pressure', value: latest?.blood_pressure || '—', icon: '🫀', accent: 'text-gray-700' },
          ].map(card => (
            <div
                key={card.label}
                className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex flex-col gap-0.5"
              >
                <span className="text-lg">{card.icon}</span>
                <span className="text-sm font-bold text-gray-800">{card.value}</span>
                <span className="text-[10px] text-gray-500">{card.label}</span>
              </div>
           
          ))}
        </div>

        {donateError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            ⚠️ {donateError}
          </div>
        )}

        {/* ── Nearby Blood Banks ── */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-800">🏥 Nearby Blood Banks</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your city first, then others in {auth?.user?.state}</p>
          </div>

          {nearbyBanks.length === 0 ? (
            <EmptyState text="No blood banks found near you." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {nearbyBanks.map(bb => <BloodBankCard key={bb.id} bb={bb} />)}
            </div>
          )}
        </section>

        {/* ── Donation History ── */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-800">🩸 Donation History</h2>
            <p className="text-xs text-gray-400 mt-0.5">All your previous donations</p>
          </div>

          {donationHistory.length === 0 ? (
            <EmptyState text="No donations yet. Your history will appear here after your first donation." />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Blood Bank', 'City', 'Units'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {donationHistory.map((d, idx) => (
                    <tr key={d.id} className={`transition-colors ${idx === 0 ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-medium text-gray-700">{fmt(d.donation_date)}</span>
                        {idx === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Latest</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{d.blood_bank_name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{d.blood_bank_city}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {d.units_collected} unit{d.units_collected > 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Screening History ── */}
        {screening.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-gray-800">📋 Screening History</h2>
                {status === 'SCREENING_EXPIRED' && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">⚠️ Expired</span>
                )}
                {status === 'SCREENING_FAILED' && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">❌ Failed</span>
                )}
                {isEligible && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">✅ Valid</span>
                )}
              </div>
              
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Hemoglobin', 'Blood Pressure', 'Weight', 'Status', 'Remarks'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {screening.map((s, idx) => (
                    <tr key={s.id}
                      className={`transition-colors ${idx === 0 && status === 'SCREENING_EXPIRED'
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-medium text-gray-700">{fmt(s.screening_date)}</span>
                        {idx === 0 && status === 'SCREENING_EXPIRED' && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">expired</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{s.hemoglobin_level} g/dL</td>
                      <td className="px-5 py-3.5 text-gray-700">{s.blood_pressure || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700">{s.weight ? `${s.weight} kg` : '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                          s.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                                                  'bg-yellow-100 text-yellow-700'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{s.remarks || '—'}</td>
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

function EmptyState({ text }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}