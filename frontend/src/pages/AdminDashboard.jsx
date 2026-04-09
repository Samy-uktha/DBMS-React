import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [testing, setTesting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("ALL");
  const [donations, setDonations] = useState([]);
  const [showDonations, setShowDonations] = useState(false);
  const [loadingDonations, setLoadingDonations] = useState(false);

  useEffect(() => {
    if (!auth) {
      navigate("/login");
      return;
    }
  }, [auth, navigate]);

  useEffect(() => {
    if (!auth?.token) return;
    fetch("http://localhost:5000/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setTesting(data.testing);
        setLoading(false);
      });
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    fetch("http://localhost:5000/api/admin/bloodbanks", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then(setBanks);
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    fetch(
      `http://localhost:5000/api/admin/inventory?blood_bank_id=${selectedBank}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      },
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch inventory");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setInventory(data);
        } else {
          console.error("Invalid inventory response:", data);
          setInventory([]);
        }
      })
      .catch((err) => {
        console.error("Inventory fetch error:", err);
        setInventory([]);
      });
  }, [selectedBank, auth?.token]);

  const fetchDonations = async () => {
    try {
      setLoadingDonations(true);

      const res = await fetch("http://localhost:5000/api/admin/donations", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const data = await res.json();

      setDonations(data);
      setShowDonations(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonations(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 rounded-full p-1.5">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="font-extrabold text-red-600 text-lg tracking-tight">
              BloodDonate
            </span>
          </div>
          <div className="font-bold">ADMIN DASHBOARD</div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">
                {auth?.user?.name}
              </span>
              <span className="text-xs text-gray-400">{auth?.user?.city}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-white hover:bg-red-600
                         border border-red-200 hover:border-red-600 px-3 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 🔥 STATS GRID */}

        <div className="flex flex-row gap-2 overflow-x-auto pb-2 sm:overflow-x-visible">
          {[
            {
              label: "Blood Banks",
              value: stats.total_blood_banks,
              icon: "🏥",
            },
            { label: "Donors", value: stats.total_donors, icon: "🧑‍🤝‍🧑" },
            { label: "Hospitals", value: stats.total_hospitals, icon: "🏨" },
            { label: "Donations", value: stats.total_donations, icon: "🩸" },
            {
              label: "Units Collected",
              value: stats.total_units_donated,
              icon: "🧪",
            },
            {
              label: "Fulfilled Requests",
              value: stats.completed_requests,
              icon: "✅",
            },
            {
              label: "Pending Requests",
              value: stats.pending_requests,
              icon: "⏳",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl p-2 shadow-sm border flex-1 min-w-[100px] text-center"
            >
              <span className="text-xl">{card.icon}</span>
              <p className="text-base font-bold leading-tight">{card.value}</p>
              <p className="text-[15px] tracking-tight text-gray-500 truncate">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* 🔥 MAIN ACTION BUTTONS */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            onClick={() => navigate("/admin/requests")}
            className="cursor-pointer bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-800">Manage Requests</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.pending_requests} pending approvals
            </p>
          </div>

          <div
            onClick={() => navigate("/admin/testing")}
            className="cursor-pointer bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-800">Blood Testing</h3>
            <p className="text-sm text-gray-500 mt-1">
              {testing?.units_pending_testing || 0} units awaiting testing
            </p>
          </div>
        </div>

        {/* 🧪 INVENTORY SECTION */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">
            Inventory Overview
          </h3>

          <div className="mb-4 flex gap-3 items-center">
            <label className="text-sm text-gray-600">
              Filter by Blood Bank:
            </label>
            <select
              className="border rounded-lg p-2 text-sm"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <option value="ALL">All Banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-2 px-3">Blood Group</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3 text-green-600">Available</th>
                  <th className="py-2 px-3 text-blue-600">Issued</th>
                  <th className="py-2 px-3 text-yellow-600">Pending Test</th>
                  <th className="py-2 px-3 text-red-600">Discarded</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((row) => (
                  <tr
                    key={`${row.blood_group}-${row.blood_bank_id || "all"}`}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 font-semibold">
                      {row.blood_group}
                    </td>
                    <td className="py-2 px-3">{row.total_units}</td>
                    <td className="py-2 px-3 text-green-600">
                      {row.available}
                    </td>
                    <td className="py-2 px-3 text-blue-600">{row.issued}</td>
                    <td className="py-2 px-3 text-yellow-600">
                      {row.pending_test}
                    </td>
                    <td className="py-2 px-3 text-red-600">{row.discarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🩸 DONATIONS SECTION */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Donations</h3>

            <button
              onClick={fetchDonations}
              className="text-sm text-red-600 hover:underline"
            >
              {showDonations ? "Refresh" : "View All"}
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Total Donations: {stats.total_donations}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Total Units Collected: {stats.total_units_donated}
          </p>

          {/* 🔥 LOADING */}
          {loadingDonations && (
            <p className="text-sm text-gray-400">Loading donations...</p>
          )}

          {/* 🔥 DONATIONS TABLE */}
          {showDonations && !loadingDonations && (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-3 py-2">Donor</th>
                    <th className="px-3 py-2">Blood Group</th>
                    <th className="px-3 py-2">Units</th>
                    <th className="px-3 py-2">Blood Bank</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{d.donor_name || "—"}</td>
                      <td className="px-3 py-2">{d.blood_group}</td>
                      <td className="px-3 py-2">{d.units_collected}</td>
                      <td className="px-3 py-2">{d.blood_bank_name || "—"}</td>
                      <td className="px-3 py-2">
                        {new Date(d.donation_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {donations.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">No donations found</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
