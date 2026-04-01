import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorForm() {
  const { auth } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ blood_group: '', date_of_birth: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/donors', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save. Try again.'); return; }
      navigate('/screening?from=new');
    } catch {
      setError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center px-4 py-10">

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Account', 'Donor Info', 'Screening', 'Dashboard'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
              ${i === 1 ? 'bg-red-600 text-white' : i < 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block
              ${i === 1 ? 'text-red-600' : 'text-gray-400'}`}>
              {step}
            </span>
            {i < 3 && <div className="w-6 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 rounded-full p-2.5">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Donor Information</h2>
            <p className="text-xs text-gray-500">Basic details — weight and donation history in next step</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select value={form.blood_group} required
              onChange={e => setForm({ ...form, blood_group: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" required
              value={form.date_of_birth}
              onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
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
            {loading ? 'Saving...' : 'Continue to Screening →'}
          </button>
        </form>
      </div>
    </div>
  );
}