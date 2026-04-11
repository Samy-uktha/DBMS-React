import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HospitalDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // NEW STATE
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    blood_group: "",
    units_requested: "",
  });

  useEffect(() => {
    if (!auth) {
      navigate("/login");
      return;
    }

    // Existing profile fetch
    fetch("http://localhost:5000/api/hospitals/me", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then((data) => setProfile(data));

    // NEW: fetch requests
    fetch("http://localhost:5000/api/hospitals/myrequests", {
      method: "GET",
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then((data) => setRequests(data))
      .finally(() => setLoading(false));
  }, []);

  // NEW: create request
  const createRequest = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:5000/api/hospitals/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(form),
    });

    setForm({ blood_group: "", units_requested: "" });

    // refresh
    const res = await fetch("http://localhost:5000/api/hospitals/myrequests", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const data = await res.json();
    setRequests(data);
    console.log("RESPONSE:", res.status, data); // ← check response
  };

  const cancelRequest = async (id) => {
    try {
      await fetch("http://localhost:5000/api/hospitals/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ request_id: id }),
      });

      // 🔥 refresh requests
      const res = await fetch(
        "http://localhost:5000/api/hospitals/myrequests",
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      );
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );

  // 🔥 METRICS
  const activeRequests = requests.filter(
    (r) => r.status === "PENDING" || r.status === "PARTIALLY_FULFILLED",
  ).length;

  const fulfilledRequests = requests.filter(
    (r) => r.status === "COMPLETED",
  ).length;

  const fulfillmentRate = requests.length
    ? Math.round((fulfilledRequests / requests.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 rounded-full p-1.5">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 
                4.5 2.09C13.09 3.81 14.76 3 
                16.5 3 19.58 3 22 5.42 
                22 8.5c0 3.78-3.4 6.86-8.55 
                11.54L12 21.35z"
                />
              </svg>
            </div>
            <span className="font-extrabold text-red-600 text-lg">
              BloodDonate
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-800 hidden sm:block">
              {profile?.hospital_name || auth?.user?.name}
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm font-medium text-red-600 border border-red-200 hover:bg-red-600
                         hover:text-white hover:border-red-600 px-3 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* EXISTING PROFILE CARD */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 rounded-full p-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">
                {profile?.hospital_name || "Hospital Dashboard"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {profile?.city}, {profile?.state} — {profile?.email}
              </p>
            </div>
          </div>
        </div>

        {/* 🔥 DASHBOARD METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "License",
              value: profile?.license_number || "N/A",
              icon: "📄",
              color: "text-gray-700",
            },
            {
              label: "Active Requests",
              value: activeRequests,
              icon: "🟡",
              color: "text-yellow-600",
            },
            {
              label: "Fulfilled",
              value: fulfilledRequests,
              icon: "🟢",
              color: "text-green-600",
            },
            {
              label: "Fulfillment Rate",
              value: `${fulfillmentRate}%`,
              icon: "📈",
              color: "text-blue-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <span className="text-2xl">{card.icon}</span>
              <p className={`text-base font-bold mt-1 ${card.color}`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* 🔴 CREATE REQUEST */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">
            Create Blood Request
          </h3>

          <form onSubmit={createRequest} className="grid sm:grid-cols-3 gap-3">
            <select
              className="border rounded-lg p-2"
              value={form.blood_group}
              onChange={(e) =>
                setForm({ ...form, blood_group: e.target.value })
              }
              required
            >
              <option value="">Blood Group</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>O+</option>
              <option>O-</option>
              <option>AB+</option>
              <option>AB-</option>
            </select>

            <input
              type="number"
              min="1"
              max="20"
              placeholder="Units (1-20)"
              className="border rounded-lg p-2"
              value={form.units_requested}
              onChange={(e) =>
                setForm({ ...form, units_requested: e.target.value })
              }
              required
            />

            <button className="bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700">
              Request
            </button>
          </form>
        </div>

        {/* 🟡 ONGOING REQUESTS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Ongoing Requests</h3>

          {requests.filter((r) => r.status !== "COMPLETED").length === 0 && (
            <p className="text-gray-400 text-sm">No ongoing requests</p>
          )}

          {requests
            .filter(
              (r) =>
                r.status === "PENDING" || r.status === "PARTIALLY_FULFILLED",
            )
            .map((r) => (
              <div
                key={r.id}
                className="border-b py-4 flex items-center justify-between"
              >
                {/* 1. LEFT SIDE: Takes up 2/3 of the width */}
                <div className="w-2/3">
                  <p className="font-semibold">{r.blood_group}</p>

                  {/* Progress Bar & Counter Container */}
                  <div className="flex items-center gap-4 mt-1">
                    {/* Progress Bar (flex-1 makes it fill the rest of the 2/3 area) */}
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(r.units_fulfilled / r.units_requested) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Progress Text */}
                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {r.units_fulfilled}/{r.units_requested} units
                    </p>
                  </div>

                  {/* Dates underneath */}
                  <div className="mt-1 flex gap-4">
                    <p className="text-xs text-gray-400">
                      Requested: {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    {r.last_fulfilled_at && (
                      <p className="text-xs text-gray-400">
                        Updated:{" "}
                        {new Date(r.last_fulfilled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. RIGHT SIDE: Takes up 1/3 of the width */}
                <div className="w-1/3 flex items-center justify-end gap-x-3">
                  <span className="text-sm text-yellow-600 font-medium px-2 py-1 bg-yellow-50 rounded">
                    {r.status.replace("_", " ")}
                  </span>

                  {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                    <button
                      onClick={() => cancelRequest(r.id)}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* 🟢 COMPLETED REQUESTS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">
            Completed Requests
          </h3>

          {requests.filter((r) => r.status === "COMPLETED").length === 0 && (
            <p className="text-gray-400 text-sm">No completed requests</p>
          )}

          {requests
            .filter((r) => r.status === "COMPLETED")
            .map((r) => (
              <div key={r.id} className="border-b py-4 flex justify-between">
                <div>
                  <p className="font-semibold">{r.blood_group}</p>

                  <p className="text-sm text-500">
                    {r.units_requested} units fulfilled
                  </p>

                  {/* 🆕 Collection Point Information */}
                  {r.collection_bank_name && (
                    <div className="mt-2 text-sm">
                      <p className="text-blue-600 font-bold">
                        Collection Point:
                      </p>
                      <p className="text-gray-700 font-medium">
                        {r.collection_bank_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.collection_address}, {r.collection_city}
                      </p>
                    </div>
                  )}

                  <div className="mt-2 flex gap-4">
                    <p className="text-xs text-gray-400">
                      Requested: {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    {r.last_fulfilled_at && (
                      <p className="text-xs text-gray-400">
                        Fulfilled:{" "}
                        {new Date(r.last_fulfilled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge - matches your Ongoing Requests style */}
                <div className="flex items-start">
                  <span className="text-sm text-green-600 font-medium px-2 py-1 bg-green-50 rounded">
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
