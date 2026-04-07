import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HospitalForm() {
  const { auth } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ hospital_name: '', license_number: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/hospitals', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${auth.token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }
      navigate('/hospital-dashboard');
    } catch {
      setError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-red-600 rounded-full p-4 mb-3 shadow-lg">
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-red-600">Hospital Details</h1>
        <p className="text-gray-500 text-sm mt-1">Complete your hospital profile</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
            <input type="text" required placeholder="e.g. City General Hospital"
              value={form.hospital_name}
              onChange={e => setForm({ ...form, hospital_name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input type="text" placeholder="e.g. KL-HOS-2024-00123"
              value={form.license_number}
              onChange={e => setForm({ ...form, license_number: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
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
            {loading ? 'Saving...' : 'Complete Registration →'}
          </button>
        </form>
      </div>
    </div>
  );
}