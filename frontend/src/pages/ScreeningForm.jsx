import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ScreeningForm() {
  const { auth }  = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewUser = searchParams.get('from') === 'new';

  const [form, setForm] = useState({
    hemoglobin_level: '', blood_pressure: '', weight: '',
    last_donation_date: '', remarks: '',
  });

  const [hospitals, setHospitals]         = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState('');

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch hospitals in donor's city/state
  useEffect(() => {
    if (!auth?.token) return;
    fetch('http://localhost:5000/api/admin/hospitals-list', {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHospitals(data);
      })
      .catch(() => {})
      .finally(() => setHospitalsLoading(false));
  }, [auth?.token]);

  const validateForm = () => {
    if (!selectedHospital) {
    setError('Please select a screening hospital before proceeding.');
    return false;
  }
    if (form.hemoglobin_level < 5 || form.hemoglobin_level > 30) {
      setError('Invalid hemoglobin level');
      return false;
    }
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!bpRegex.test(form.blood_pressure)) {
      setError('BP must be in the format 120/80');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError('');
    setLoading(true);
    try {
      // hospital_id is intentionally NOT sent — no schema change needed
      const res = await fetch('http://localhost:5000/api/screening', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body:    JSON.stringify({
          hemoglobin_level: form.hemoglobin_level,
          blood_pressure:   form.blood_pressure,
          weight:           form.weight,
          last_donation_date: form.last_donation_date || undefined,
          remarks:          form.remarks || undefined,
          hospital_id:      selectedHospital || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }
      navigate('/donor-dashboard');
    } catch {
      setError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center px-4 py-10">

      {/* Progress stepper — only for new users */}
      {isNewUser && (
        <div className="flex items-center gap-2 mb-8">
          {['Account', 'Donor Info', 'Screening', 'Dashboard'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                ${i === 2 ? 'bg-red-600 text-white' : i < 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < 2 ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block
                ${i === 2 ? 'text-red-600' : 'text-gray-400'}`}>
                {step}
              </span>
              {i < 3 && <div className="w-6 h-px bg-gray-300" />}
            </div>
          ))}
        </div>
      )}

      {/* Back button — only for existing users */}
      {!isNewUser && (
        <button
          onClick={() => navigate('/donor-dashboard')}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
          ← Back to Dashboard
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 rounded-full p-2.5">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Health Screening</h2>
            <p className="text-xs text-gray-500">
              {isNewUser ? 'Eligibility check + donation history' : 'Update your health screening details'}
            </p>
          </div>
        </div>

        {!isNewUser && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-5 text-xs text-orange-700">
            🔁 Your previous screening has expired or is missing. Please fill in your latest health details.
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-700">
          ℹ️ Hemoglobin ≥ 12.5 g/dL, weight ≥ 45 kg, and normal blood pressure (90–140 / 60–90 mmHg) required to pass.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Screening Hospital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Screening Hospital
              <span className="text-gray-400 text-xs ml-1">(where you're getting screened)</span>
            </label>
            {hospitalsLoading ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400">
                Loading hospitals...
              </div>
            ) : hospitals.length === 0 ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400">
                No hospitals found in your area
              </div>
            ) : (
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Select a hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hospital_name} — {h.city}, {h.state}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Hemoglobin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hemoglobin Level (g/dL)
            </label>
            <input type="number" step="0.1" min="1" placeholder="e.g. 14.5" required
              disabled={!selectedHospital}
              value={form.hemoglobin_level}
              onChange={e => setForm({ ...form, hemoglobin_level: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Blood Pressure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Pressure
            </label>
            <input type="text" placeholder="e.g. 120/80" required
              disabled={!selectedHospital}
              value={form.blood_pressure}
              onChange={e => setForm({ ...form, blood_pressure: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) <span className="text-gray-400 text-xs">— min 45 kg to donate</span>
            </label>
            <input type="number" step="0.1" min="1" placeholder="e.g. 65.5" required
              disabled={!selectedHospital}
              value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Last Donation Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Donation Date <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input type="date"
              disabled={!selectedHospital}
              value={form.last_donation_date}

              onChange={e => setForm({ ...form, last_donation_date: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea rows={3} placeholder="Any medical notes..."
              disabled={!selectedHospital}
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3
                       rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Submitting...' : 'Submit & View Dashboard →'}
          </button>
        </form>
      </div>
    </div>
  );
}