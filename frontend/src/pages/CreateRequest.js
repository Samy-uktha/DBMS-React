import React, { useState } from "react";
import { createBloodRequest } from "../api";

function CreateRequest() {
  const [form, setForm] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const data = await createBloodRequest(form);
    alert(data.message);
  };

  return (
    <div>
      <h2>Create Blood Request</h2>

      <input name="blood_type" placeholder="Blood Type" onChange={handleChange} />
      <input name="units_required" placeholder="Units Required" onChange={handleChange} />
      <input name="urgency_level" placeholder="Urgency" onChange={handleChange} />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default CreateRequest;