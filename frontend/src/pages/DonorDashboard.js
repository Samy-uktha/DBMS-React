import React, { useEffect, useState } from "react";
import { getDonorDonations } from "../api";

function DonorDashboard() {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await getDonorDonations();
      setDonations(data);
    }

    fetchData();
  }, []);

  return (
    <div>
      <h2>My Donations</h2>

      {donations.length === 0 && <p>No donations found</p>}

      {donations.map((d) => (
        <div key={d.id}>
          <p>Units: {d.units_collected}</p>
          <p>Date: {d.date}</p>
        </div>
      ))}
    </div>
  );
}

export default DonorDashboard;