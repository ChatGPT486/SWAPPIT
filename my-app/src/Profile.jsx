// Profile.js
import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { Link } from "react-router-dom";   // ✅ import Link
import "./Profile.css";
import logo from "./assets/logo.jpg";

import Products from "./Products";
import Marketplace from "./Marketplace";

function Profile() {
  const { user, setUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("profile");

  const handlePhotoUpload = (e) => {
    if (e.target.files[0]) {
      setUser({ ...user, photo: URL.createObjectURL(e.target.files[0]) });
    }
  };

  return (
    <div className="profile-page">
      {/* ✅ Navbar now uses Link */}
      <nav className="navbar">
        <div className="nav-left">
          <img src={logo} alt="TradeHub Logo" className="logo" />
          <span className="brand">TradeHub</span>
        </div>
        <div className="nav-right">
          <Link className="nav-btn" to="/marketplace">Marketplace</Link>
          <Link className="nav-btn" to="/profile">My Space</Link>
        </div>
      </nav>

      <h1 className="page-title">My Personal Space</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "profile" ? "tab black" : "tab white"}
          onClick={() => setActiveTab("profile")}
        >
          👤 Profile
        </button>
        <button
          className={activeTab === "products" ? "tab black" : "tab white"}
          onClick={() => setActiveTab("products")}
        >
          📦 My Products
        </button>
        <button
          className={activeTab === "negotiations" ? "tab black" : "tab white"}
          onClick={() => setActiveTab("negotiations")}
        >
          🤝 Negotiations
        </button>
        <button
          className={activeTab === "notifications" ? "tab black" : "tab white"}
          onClick={() => setActiveTab("notifications")}
        >
          🔔 Notifications
        </button>
        <button
          className={activeTab === "recommendations" ? "tab black" : "tab white"}
          onClick={() => setActiveTab("recommendations")}
        >
          ⭐ Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "profile" && (
          <div className="profile-section">
            <div className="profile-left">
              <img src={user.photo} alt="Profile" className="profile-pic" />
              <label className="upload-btn">
                Change Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
              </label>
            </div>
            <div className="profile-right">
              <label>Name</label>
              <p className="readonly big-box">{user.firstName} {user.lastName}</p>

              <label>Email</label>
              <p className="readonly big-box">{user.email}</p>

              <label>Contact</label>
              <p className="readonly big-box">{user.contact}</p>

              <label>Bio</label>
              <p className="readonly big-box">{user.bio}</p>

              <p className="profile-rating">⭐ 4.5 (23 reviews)</p>
            </div>
          </div>
        )}

        {activeTab === "products" && <Products user={user} setUser={setUser} />}
        {activeTab === "marketplace" && <Marketplace user={user} />}
        {activeTab === "negotiations" && <h2>Negotiations Section</h2>}
        {activeTab === "notifications" && <h2>Notifications Section</h2>}
        {activeTab === "recommendations" && <h2>Recommendations Section</h2>}
      </div>
    </div>
  );
}

export default Profile;
