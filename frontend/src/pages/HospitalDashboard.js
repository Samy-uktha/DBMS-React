import React, { useEffect, useState } from "react";
import { getHospitalRequests } from "../api";

function HospitalDashboard() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await getHospitalRequests();
      setRequests(data);
    }

    fetchData();
  }, []);

  return (
    <div>
      <h2>My Blood Requests</h2>

      {requests.length === 0 && <p>No requests yet</p>}

      {requests.map((r) => (
        <div key={r.id}>
          <p>Blood Type: {r.blood_type}</p>
          <p>Units Required: {r.units_required}</p>
          <p>Status: {r.status}</p>
        </div>
      ))}
    </div>
  );
}

export default HospitalDashboard;