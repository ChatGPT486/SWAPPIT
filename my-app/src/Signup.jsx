import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";

function Signup() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    bio: "",
    photo: "/assets/default-profile.png",
    agreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, photo: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("You must agree to the confidentiality policy and terms of service before continuing.");
      return;
    }
    setUser(formData); // ✅ store everything in context
    navigate("/profile");
  };

  return (
    <div className="signup-container">
      <h1>Create Account</h1>
      <p>Join the trading community</p>

      <form className="signup-form" onSubmit={handleSubmit}>
        <input name="firstName" type="text" placeholder="First Name" onChange={handleChange} required />
        <input name="lastName" type="text" placeholder="Last Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="contact" type="text" placeholder="Contact Number" onChange={handleChange} required />


        <label className="signup-checkbox">
          <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} />
          I agree to the confidentiality policy and terms of service
        </label>

        <button type="submit" className="signup-btn">Create Account →</button>
      </form>

      <p className="signup-footer">
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </div>
  );
}

export default Signup;
