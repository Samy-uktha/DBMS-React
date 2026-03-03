import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DONOR",
    city: "",
    state: "",
    pincode: "",
    blood_group: "",
    date_of_birth: "",
    hospital_name: "",
    license_number: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", form);
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4 mx-auto" style={{ maxWidth: "600px" }}>
        <h3 className="text-center mb-4">Register</h3>

        <form onSubmit={handleRegister}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Register As</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
              <option value="DONOR">Donor</option>
              <option value="HOSPITAL">Hospital</option>
            </select>
          </div>

          {/* Donor Fields */}
          {form.role === "DONOR" && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Blood Group</label>
                <select
                  name="blood_group"
                  className="form-select"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  className="form-control"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Hospital Fields */}
          {form.role === "HOSPITAL" && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Hospital Name</label>
                <input
                  type="text"
                  name="hospital_name"
                  className="form-control"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  name="license_number"
                  className="form-control"
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button className="btn btn-success w-100 mt-3">
            Register
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;