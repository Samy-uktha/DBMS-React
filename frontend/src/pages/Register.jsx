import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CITY_STATE_MAP = {
  'Alappuzha':         'Kerala',
  'Ahmedabad':         'Gujarat',
  'Agra':              'Uttar Pradesh',
  'Allahabad':         'Uttar Pradesh',
  'Amritsar':          'Punjab',
  'Aurangabad':        'Maharashtra',
  'Ballari':           'Karnataka',
  'Belagavi':          'Karnataka',
  'Bengaluru':         'Karnataka',
  'Bhopal':            'Madhya Pradesh',
  'Chandigarh':        'Punjab',
  'Chennai':           'Tamil Nadu',
  'Coimbatore':        'Tamil Nadu',
  'Davanagere':        'Karnataka',
  'Delhi':             'Delhi',
  'Dharwad':           'Karnataka',
  'Dindigul':          'Tamil Nadu',
  'Durgapur':          'West Bengal',
  'Ernakulam':         'Kerala',
  'Erode':             'Tamil Nadu',
  'Gaya':              'Bihar',
  'Guntur':            'Andhra Pradesh',
  'Howrah':            'West Bengal',
  'Hubli':             'Karnataka',
  'Hyderabad':         'Telangana',
  'Idukki':            'Kerala',
  'Indore':            'Madhya Pradesh',
  'Jabalpur':          'Madhya Pradesh',
  'Jaipur':            'Rajasthan',
  'Jodhpur':           'Rajasthan',
  'Kanpur':            'Uttar Pradesh',
  'Kannur':            'Kerala',
  'Kasaragod':         'Kerala',
  'Kochi':             'Kerala',
  'Kolkata':           'West Bengal',
  'Kollam':            'Kerala',
  'Kota':              'Rajasthan',
  'Kozhikode':         'Kerala',
  'Kottayam':          'Kerala',
  'Kurnool':           'Andhra Pradesh',
  'Lucknow':           'Uttar Pradesh',
  'Ludhiana':          'Punjab',
  'Madurai':           'Tamil Nadu',
  'Malappuram':        'Kerala',
  'Mangaluru':         'Karnataka',
  'Mumbai':            'Maharashtra',
  'Mysuru':            'Karnataka',
  'Nagpur':            'Maharashtra',
  'Nashik':            'Maharashtra',
  'Nellore':           'Andhra Pradesh',
  'New Delhi':         'Delhi',
  'Nizamabad':         'Telangana',
  'Palakkad':          'Kerala',
  'Pathanamthitta':    'Kerala',
  'Patna':             'Bihar',
  'Pune':              'Maharashtra',
  'Rajkot':            'Gujarat',
  'Salem':             'Tamil Nadu',
  'Surat':             'Gujarat',
  'Thiruvananthapuram':'Kerala',
  'Thoothukudi':       'Tamil Nadu',
  'Thrissur':          'Kerala',
  'Tiruchirappalli':   'Tamil Nadu',
  'Tirunelveli':       'Tamil Nadu',
  'Udaipur':           'Rajasthan',
  'Vadodara':          'Gujarat',
  'Varanasi':          'Uttar Pradesh',
  'Vellore':           'Tamil Nadu',
  'Vijayawada':        'Andhra Pradesh',
  'Visakhapatnam':     'Andhra Pradesh',
  'Warangal':          'Telangana',
  'Wayanad':           'Kerala',
};

const CITIES = Object.keys(CITY_STATE_MAP).sort();

export default function Register() {
  const [searchParams] = useSearchParams();
  const role     = searchParams.get('role') || 'DONOR';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    address_line: '', city: '', state: '', pincode: '',
  });
  const [errors,  setErrors]  = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Validation rules ──────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Full name is required.';

    if (!form.email.trim())
      e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address (e.g. you@gmail.com).';

    if (!form.password)
      e.password = 'Password is required.';
    else if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters.';

    if (form.phone && !/^\d{10}$/.test(form.phone))
      e.phone = 'Phone must be exactly 10 digits.';

    if (!form.city)
      e.city = 'Please select a city.';

    if (!form.state.trim())
      e.state = 'State is required.';

    if (!form.pincode.trim())
      e.pincode = 'Pincode is required.';
    else if (!/^\d{6}$/.test(form.pincode))
      e.pincode = 'Pincode must be 6 digits.';

    return e;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    // Clear individual field error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'city') {
      setForm(prev => ({
        ...prev,
        city:  value,
        state: CITY_STATE_MAP[value] || '',
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error === 'EMAIL_EXISTS' ? 'Email already registered.' : data.error || 'Registration failed.');
        return;
      }
      login(data.token, data.user);
      navigate(role === 'DONOR' ? '/donor-form' : '/hospital-form');
    } catch {
      setApiError('Server unreachable. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'DONOR' ? 'Donor' : 'Hospital';

  // Helper for field error display
  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    ) : null;

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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="name" type="text"
                placeholder={role === 'DONOR' ? 'John Doe' : 'City General Hospital'}
                value={form.name} onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-red-400
                            ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
              />
              <FieldError field="name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email" type="email" placeholder="you@gmail.com"
                value={form.email} onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-red-400
                            ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
              />
              <FieldError field="email" />
            </div>
          </div>

          {/* Password + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                name="password" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-red-400
                            ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <FieldError field="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                name="phone" type="tel" placeholder="10 digit number"
                value={form.phone} onChange={handleChange}
                maxLength={10}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-red-400
                            ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
              />
              <FieldError field="phone" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              name="address_line" type="text" placeholder="123 Main Street"
              value={form.address_line} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                name="city" value={form.city} onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-red-400
                            ${errors.city ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Select city</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <FieldError field="city" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                name="state" type="text" placeholder="Auto-filled"
                value={form.state} onChange={handleChange}
                readOnly={!!CITY_STATE_MAP[form.city]}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-red-400 cursor-not-allowed"
              />
              <FieldError field="state" />
            </div>
          </div>

          {/* Pincode */}
          <div className="sm:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              name="pincode" type="text" placeholder="6 digit pincode"
              value={form.pincode} onChange={handleChange}
              maxLength={6}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50
                          focus:outline-none focus:ring-2 focus:ring-red-400
                          ${errors.pincode ? 'border-red-400' : 'border-gray-200'}`}
            />
            <FieldError field="pincode" />
          </div>

          {apiError && (
            <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100
                          rounded-lg py-2 px-3">
              {apiError}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white
                       font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
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