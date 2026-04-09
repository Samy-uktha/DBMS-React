import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIALLY_FULFILLED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const API = "http://localhost:5000/api";

export default function AdminRequests() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  // --- data ---
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // --- mode toggle ---
  const [mode, setMode] = useState("auto");

  // --- auto fill state ---
  const [autoStrategy, setAutoStrategy] = useState("timestamp");
  const [autoRunning, setAutoRunning] = useState(false);

  // --- manual fill state ---
  const [search, setSearch] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [hospitalSearch, setHospitalSearch] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalRequests, setHospitalRequests] = useState([]);
  const [loadingHospReq, setLoadingHospReq] = useState(false);

  // --- fulfill modal ---
  const [fulfillModal, setFulfillModal] = useState(null);
  const [fulfillUnits, setFulfillUnits] = useState(1);
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillError, setFulfillError] = useState(null);

  const searchRef = useRef();

  const headers = { Authorization: `Bearer ${auth?.token}` };
  if (!auth) return null;

  // ---- fetch all requests ----
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/requests`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // ---- fetch all hospitals for search ----
  const fetchHospitals = async () => {
    try {
      const res = await fetch(`${API}/admin/hospitals-list`, { headers });
      const data = await res.json();
      setHospitals(Array.isArray(data) ? data : []);
    } catch {
      setHospitals([]);
    }
  };

  useEffect(() => {
    if (!auth) { navigate("/login"); return; }
    fetchRequests();
    fetchHospitals();
  }, [auth?.token]);

  // ---- hospital search filter ----
  useEffect(() => {
    if (!search.trim()) { setHospitalSearch([]); return; }
    const q = search.toLowerCase();
    setHospitalSearch(
      hospitals.filter(
        (h) =>
          h.hospital_name.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q) ||
          h.state?.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [search, hospitals]);

  // ---- select hospital → load their requests ----
  const selectHospital = async (h) => {
    setSelectedHospital(h);
    setSearch(h.hospital_name);
    setHospitalSearch([]);
    setLoadingHospReq(true);
    try {
      const res = await fetch(`${API}/admin/hospital-requests/${h.id}`, { headers });
      const data = await res.json();
      setHospitalRequests(Array.isArray(data) ? data : []);
    } catch {
      setHospitalRequests([]);
    } finally {
      setLoadingHospReq(false);
    }
  };

  // ---- auto fulfill ----
  const runAutoFulfill = async () => {
    setAutoRunning(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API}/admin/auto-fulfill`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: autoStrategy }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ type: "success", text: data.message || "Auto-fulfill complete!" });
        fetchRequests();
      } else {
        setActionMsg({ type: "error", text: data.error || "Failed" });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error" });
    } finally {
      setAutoRunning(false);
    }
  };

  // ---- open fulfill modal ----
  const openFulfillModal = (req) => {
    const needed = req.units_requested - req.units_fulfilled;
    setFulfillUnits(needed > 0 ? needed : 1);
    setFulfillModal({ request: req });
    setFulfillError(null);
  };

  // ---- submit manual fulfill ----
  const submitFulfill = async () => {
    if (!fulfillModal) return;
    setFulfilling(true);
    setFulfillError(null);
    try {
      const res = await fetch(`${API}/admin/fulfill-request`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: fulfillModal.request.id,
          units: fulfillUnits,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ type: "success", text: data.message || "Units issued!" });
        setFulfillModal(null);
        setFulfillError(null);
        fetchRequests();
        if (selectedHospital) selectHospital(selectedHospital);
      } else {
        setFulfillError(data.error || "Failed to fulfill");
      }
    } catch {
      setFulfillError("Network error");
    } finally {
      setFulfilling(false);
    }
  };

  // ---- derived stats ----
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const partial = requests.filter((r) => r.status === "PARTIALLY_FULFILLED").length;
  const completed = requests.filter((r) => r.status === "COMPLETED").length;

  const displayList = mode === "auto"
    ? (autoStrategy === "timestamp"
        ? [...requests].filter(r => r.status !== "COMPLETED" && r.status !== "CANCELLED")
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        : [...requests].filter(r => r.status !== "COMPLETED" && r.status !== "CANCELLED")
            .sort((a, b) => {
              const pa = b.units_fulfilled / b.units_requested;
              const pb = a.units_fulfilled / a.units_requested;
              return pa - pb;
            })
      )
    : (selectedHospital ? hospitalRequests : []);

  return (
    <div className="min-h-screen bg-[#f7f3f0] font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-red-600 rounded-full p-1.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="font-black text-red-600 text-lg tracking-tight">BloodDonate</span>
            </div>
            <span className="text-gray-300 text-xl font-thin">/</span>
            <span className="font-semibold text-gray-700 text-sm">Manage Requests</span>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── Action Message ── */}
        {actionMsg && (
          <div className={`rounded-xl px-5 py-3 text-sm font-medium flex items-center justify-between
            ${actionMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending", value: pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
            { label: "Partial", value: partial, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: "Completed", value: completed, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Mode Toggle ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1.5 w-fit">
          {[
            { key: "auto", label: "⚡ Auto Fulfill" },
            { key: "manual", label: "🏥 Manual Fulfill" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${mode === m.key
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            AUTO MODE
        ══════════════════════════════════════ */}
        {mode === "auto" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">
                Fulfillment Strategy
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    key: "timestamp",
                    title: "First Come, First Served",
                    desc: "Requests are fulfilled in the order they were created. Oldest requests get priority.",
                    icon: "🕐",
                  },
                  {
                    key: "partial",
                    title: "Prioritize Partial Requests",
                    desc: "Requests closest to completion are fulfilled first. Maximizes completed requests.",
                    icon: "📊",
                  },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setAutoStrategy(s.key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all
                      ${autoStrategy === s.key
                        ? "border-red-500 bg-red-50"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className={`font-bold text-sm ${autoStrategy === s.key ? "text-red-700" : "text-gray-700"}`}>
                        {s.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={runAutoFulfill}
                disabled={autoRunning}
                className="mt-4 w-full bg-red-600 text-white rounded-xl py-3 font-bold text-sm
                           hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all
                           flex items-center justify-center gap-2"
              >
                {autoRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>Fulfill Requests</>
                )}
              </button>
            </div>

            {/* Queue Preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-1 text-sm uppercase tracking-wide">
                Fulfillment Queue
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Preview order in which requests will be processed
              </p>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : displayList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {displayList.map((r, i) => (
                    <RequestRow key={r.id} rank={i + 1} r={r} showFulfill={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            MANUAL MODE
        ══════════════════════════════════════ */}
        {mode === "manual" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                Search Hospital
              </h3>
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedHospital(null); }}
                  placeholder="Search by hospital name, city or state..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                />
                {hospitalSearch.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100
                                  rounded-xl shadow-lg z-10 overflow-hidden">
                    {hospitalSearch.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => selectHospital(h)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors
                                   flex items-center justify-between border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{h.hospital_name}</p>
                          <p className="text-xs text-gray-400">{h.city}, {h.state}</p>
                        </div>
                        <span className="text-xs text-gray-300">{h.license_number || "—"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedHospital && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedHospital.hospital_name}</h3>
                    <p className="text-xs text-gray-400">{selectedHospital.city}, {selectedHospital.state}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                    {hospitalRequests.length} request{hospitalRequests.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingHospReq ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
                  </div>
                ) : hospitalRequests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No requests for this hospital</p>
                ) : (
                  <div className="space-y-2">
                    {hospitalRequests.map((r) => (
                      <RequestRow
                        key={r.id}
                        r={r}
                        showFulfill={r.status !== "COMPLETED" && r.status !== "CANCELLED"}
                        onFulfill={() => openFulfillModal(r)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedHospital && !search && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">🏥</p>
                <p className="text-gray-400 text-sm">Search for a hospital above to view their requests</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════
          FULFILL MODAL
      ══════════════════════════════════════ */}
      {fulfillModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-800 text-lg">Fulfill Request</h3>
              <button
                onClick={() => { setFulfillModal(null); setFulfillError(null); }}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >✕</button>
            </div>

            {/* Request summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Blood Group</span>
                <span className="font-bold text-red-600 text-base">{fulfillModal.request.blood_group}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hospital</span>
                <span className="font-semibold text-gray-700">
                  {selectedHospital?.hospital_name || `#${fulfillModal.request.hospital_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Progress</span>
                <span className="font-semibold text-gray-700">
                  {fulfillModal.request.units_fulfilled} / {fulfillModal.request.units_requested} units
                </span>
              </div>
              <div className="pt-1">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${(fulfillModal.request.units_fulfilled / fulfillModal.request.units_requested) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Units input */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Units to Fulfill
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFulfillUnits(Math.max(1, fulfillUnits - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600
                             hover:bg-gray-100 text-xl font-bold transition-colors flex items-center justify-center"
                >−</button>
                <input
                  type="number"
                  min="1"
                  max={fulfillModal.request.units_requested - fulfillModal.request.units_fulfilled}
                  value={fulfillUnits}
                  onChange={(e) => setFulfillUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-center
                             font-bold text-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <button
                  onClick={() => setFulfillUnits(Math.min(
                    fulfillModal.request.units_requested - fulfillModal.request.units_fulfilled,
                    fulfillUnits + 1
                  ))}
                  className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600
                             hover:bg-gray-100 text-xl font-bold transition-colors flex items-center justify-center"
                >+</button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                Max: {fulfillModal.request.units_requested - fulfillModal.request.units_fulfilled} units remaining
              </p>
            </div>

            {/* Error inside modal */}
            {fulfillError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {fulfillError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setFulfillModal(null); setFulfillError(null); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600
                           text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitFulfill}
                disabled={fulfilling}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold
                           hover:bg-red-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {fulfilling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>🩸 Fulfill Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable request row ── */
function RequestRow({ r, rank, showFulfill, onFulfill }) {
  const pct = r.units_requested > 0
    ? Math.round((r.units_fulfilled / r.units_requested) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200
                    hover:bg-gray-50/50 transition-all group">
      {rank !== undefined && (
        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs font-black
                        flex items-center justify-center shrink-0">
          {rank}
        </div>
      )}

      <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-xs
                      flex items-center justify-center shrink-0 leading-tight text-center">
        {r.blood_group}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600">
            {r.units_fulfilled}/{r.units_requested} units
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
            {r.status.replace("_", " ")}
          </span>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {pct}% · Requested {new Date(r.created_at).toLocaleDateString()}
        </p>
      </div>

      {showFulfill && (
        <button
          onClick={onFulfill}
          className="shrink-0 bg-red-600 text-white text-xs font-bold px-3 py-1.5
                     rounded-lg hover:bg-red-700 transition-all opacity-0 group-hover:opacity-100"
        >
          Fulfill
        </button>
      )}
    </div>
  );
}