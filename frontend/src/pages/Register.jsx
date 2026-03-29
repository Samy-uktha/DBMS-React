import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'DONOR'; // DONOR or HOSPITAL
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    address_line: '', city: '', state: '', pincode: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'EMAIL_EXISTS' ? 'Email already registered.' : data.error || 'Registration failed.');
        return;
      }
      login(data.token, data.user);
      navigate(role === 'DONOR' ? '/donor-form' : '/hospital-form');
    } catch {
      setError('Server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'DONOR' ? 'Donor' : 'Hospital';
  const roleColor = 'red';

  const fields = [
    { name: 'name',         label: 'Full Name',   type: 'text',     placeholder: role === 'DONOR' ? 'John Doe' : 'City General Hospital', required: true },
    { name: 'email',        label: 'Email',       type: 'email',    placeholder: 'you@example.com',   required: true },
    { name: 'password',     label: 'Password',    type: 'password', placeholder: '••••••••',           required: true },
    { name: 'phone',        label: 'Phone',       type: 'tel',      placeholder: '9876543210',         required: false },
    { name: 'address_line', label: 'Address',     type: 'text',     placeholder: '123 Main Street',   required: false },
    { name: 'city',         label: 'City',        type: 'text',     placeholder: 'Palakkad',           required: true },
    { name: 'state',        label: 'State',       type: 'text',     placeholder: 'Kerala',             required: true },
    { name: 'pincode',      label: 'Pincode',     type: 'text',     placeholder: '678001',             required: true },
  ];

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-red-600 rounded-full p-4 mb-3 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                     2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                     C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                     c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-red-600">Register as {roleLabel}</h1>
        <p className="text-gray-500 text-sm mt-1">Create your account to get started</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        {/* Role badge */}
        <div className="mb-5 flex items-center gap-2">
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            {roleLabel}
          </span>
          <button onClick={() => navigate('/role-select')}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">
            Change role
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.name} className={f.name === 'address_line' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                  {!f.required && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                </label>
                <input
                  name={f.name} type={f.type} placeholder={f.placeholder}
                  value={form[f.name]} onChange={handleChange}
                  required={f.required}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold
                       py-3 rounded-xl transition-colors disabled:opacity-60 mt-1">
            {loading ? 'Creating account...' : `Create ${roleLabel} Account →`}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')}
            className="text-red-600 font-semibold hover:underline">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}