import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function BloodTesting() {
  const navigate = useNavigate();

  const [pending, setPending] = useState([]);
  const [tested, setTested] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    hiv: false,
    hepatitis_b: false,
    hepatitis_c: false,
    malaria: false,
    syphilis: false,
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/testing-units");
      setPending(res.data.pending || []);
      setTested(res.data.tested || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post("/admin/blood-test", {
        blood_unit_id: selectedUnit.id,
        ...form,
      });

      setSelectedUnit(null);
      setForm({
        hiv: false,
        hepatitis_b: false,
        hepatitis_c: false,
        malaria: false,
        syphilis: false,
      });

      fetchUnits();
    } catch (err) {
      console.error(err);
      alert("Error submitting test");
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "text-green-600 font-semibold";
      case "DISCARDED":
        return "text-red-600 font-semibold";
      case "EXPIRED":
        return "text-gray-500 font-semibold";
      default:
        return "text-yellow-600 font-semibold";
    }
  };

  const handleApproveAll = async () => {
    try {
      await api.post("/admin/approve-all-units");
      fetchUnits();
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  const handleCheckExpiry = async () => {
    try {
      await api.post("/admin/check-expiry");
      fetchUnits();
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blood Unit Testing</h1>
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleApproveAll}
          disabled={pending.length === 0}
          className={`px-4 py-2 rounded-lg text-white transition
    ${
      pending.length === 0
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700"
    }
  `}
        >
          Approve All Units
        </button>

        <button
          onClick={handleCheckExpiry}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Check Expired Units
        </button>
      </div>

      {/* Pending Section */}
      <div className="bg-white rounded-2xl p-6 shadow border">
        <h2 className="text-lg font-semibold mb-4 text-yellow-600">
          Pending Testing
        </h2>

        {pending.length === 0 ? (
          <p className="text-gray-500">No pending units</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm border-b">
                <th className="pb-2">ID</th>
                <th>Blood Group</th>
                <th>Collection Date</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((unit) => (
                <tr
                  key={unit.id}
                  onClick={() => setSelectedUnit(unit)}
                  className="border-b cursor-pointer hover:bg-yellow-50"
                >
                  <td className="py-2">{unit.id}</td>
                  <td>{unit.blood_group}</td>
                  <td>{unit.collection_date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tested Section */}
      <div className="bg-white rounded-2xl p-6 shadow border">
        <h2 className="text-lg font-semibold mb-4 text-green-600">
          Tested Units
        </h2>

        {tested.length === 0 ? (
          <p className="text-gray-500">No tested units yet</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm border-b">
                <th className="pb-2">ID</th>
                <th>Blood Group</th>
                <th>Status</th>
                <th>Tested At</th>
              </tr>
            </thead>
            <tbody>
              {tested.map((unit) => (
                <tr key={unit.id} className="border-b">
                  <td className="py-2">{unit.id}</td>
                  <td>{unit.blood_group}</td>
                  <td className={statusColor(unit.status)}>{unit.status}</td>
                  <td>
                    {unit.tested_at
                      ? new Date(unit.tested_at).toISOString().split("T")[0]
                      : "Not Tested"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold">
              Test Unit #{selectedUnit.id}
            </h3>
            Simulates a lab test: Unit is tested for presence of infectious
            diseases, box is marked if any diseases were found
            <div className="space-y-2">
              {Object.keys(form).map((key) => (
                <label key={key} className="flex justify-between items-center">
                  <span className="capitalize">{key.replace("_", " ")}</span>
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.checked })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setSelectedUnit(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
