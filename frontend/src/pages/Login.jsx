import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const REDIRECT_MAP = {
    DONOR_FORM:         '/donor-form',
    SCREENING_FORM:     '/screening',
    DONOR_DASHBOARD:    '/donor-dashboard',
    HOSPITAL_FORM:      '/hospital-form',
    HOSPITAL_DASHBOARD: '/hospital-dashboard',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === 'USER_NOT_FOUND'  ? 'No account found. Please sign up.' :
          data.error === 'INVALID_PASSWORD'? 'Incorrect password.' :
          'Login failed. Please try again.'
        );
        return;
      }
      login(data.token, data.user);
      navigate(REDIRECT_MAP[data.redirectTo] ?? '/login');
    } catch {
      setError('Server unreachable. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-red-600 rounded-full p-4 mb-3 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                     2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                     C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                     c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">Blood Donation System</h1>
        <p className="text-gray-500 mt-1 text-sm">Sign in to save lives</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8">
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div className="text-right -mt-1">
            <button type="button" className="text-sm text-red-500 hover:underline">
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2 px-3 border border-red-100">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold
                       py-3 rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
          New user?{' '}
          <button onClick={() => navigate('/role-select')}
            className="font-bold text-gray-800 hover:text-red-600 transition-colors">
            Sign up
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">Together we can make a difference</p>
    </div>
  );
}