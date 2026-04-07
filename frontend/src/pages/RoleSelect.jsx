import { useNavigate } from 'react-router-dom';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center mb-10">
        <div className="bg-red-600 rounded-full p-4 mb-3 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                     2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                     C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                     c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">Join Us</h1>
        <p className="text-gray-500 mt-1 text-sm">Who are you registering as?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">

        {/* Donor Card */}
        <button
          onClick={() => navigate('/register?role=DONOR')}
          className="group bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-4
                     border-2 border-transparent hover:border-red-500 hover:shadow-lg
                     transition-all duration-200 cursor-pointer text-left"
        >
          <div className="bg-red-100 group-hover:bg-red-500 rounded-full p-5 transition-colors duration-200">
            <svg className="w-10 h-10 text-red-500 group-hover:text-white transition-colors duration-200"
              fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">
              Donor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Register as a blood donor and save lives in your city
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold text-red-600 group-hover:underline">
            Register as Donor →
          </span>
        </button>

        {/* Hospital Card */}
        <button
          onClick={() => navigate('/register?role=HOSPITAL')}
          className="group bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-4
                     border-2 border-transparent hover:border-red-500 hover:shadow-lg
                     transition-all duration-200 cursor-pointer text-left"
        >
          <div className="bg-red-100 group-hover:bg-red-500 rounded-full p-5 transition-colors duration-200">
            <svg className="w-10 h-10 text-red-500 group-hover:text-white transition-colors duration-200"
              fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">
              Hospital
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Register your hospital to manage blood requests and donations
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold text-red-600 group-hover:underline">
            Register as Hospital →
          </span>
        </button>
      </div>

      <button onClick={() => navigate('/login')}
        className="mt-8 text-sm text-gray-500 hover:text-red-600 transition-colors">
        ← Back to Login
      </button>
    </div>
  );
}