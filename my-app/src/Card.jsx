import React from 'react';
import { Link } from "react-router-dom";
import logo from './assets/logo.jpg'; 


function Card() {
  return (
    <div>
      {/* Hero Section */}
         {/* Hero Section */}
      <div className="hero">
        <img src={logo} alt="TradeHub Logo" className="hero-logo" />  {/* ✅ centered logo */}
        <h1>Trade What You Have for What You Need</h1>
        <p>
          Connect with others to exchange products directly. 
          No money needed, just fair trades verified by our community.
        </p>
        <div className="hero-buttons">
          <Link to="/signup" className="ctaButton">Get Started</Link>
          <Link to="/marketplace" className="secondaryButton">Browse Marketplace</Link>
        </div>
      </div>

      {/* How It Works */}
<div className="howItWorksSection">
  <h1 className="howItWorks">How It Works</h1>
  <p className="subtitle">Fair trading made simple</p>

  <div className="card">
    <div className="cardBox">
      <div className="icon-circle brown-icon">
        <i className="fas fa-user"></i>   {/* ✅ user/profile icon */}
      </div>
      <h2>List Your Items</h2>
      <p>Upload products you want to trade. Our system helps you set fair values.</p>
    </div>

    <div className="cardBox">
      <div className="icon-circle brown-icon">
        <i className="fas fa-arrow-up"></i>   {/* ✅ upward arrow icon */}
      </div>
      <h2>Find Matches</h2>
      <p>Browse items and propose exchanges. Value differences are calculated automatically.</p>
    </div>

    <div className="cardBox">
      <div className="icon-circle brown-icon">
        <i className="fas fa-shield-alt"></i>   {/* ✅ shield icon */}
      </div>
      <h2>Complete Trades</h2>
      <p>Rate your experience. Build trust through verified transactions and reviews.</p>
    </div>
  </div>
</div>


      {/* About Our Mission */}
      <div className="ourMission">
        <h1>About Our Mission</h1>
        <p>
          We believe in a sustainable economy where valuable items find new owners 
          instead of being discarded. Our platform connects people to trade fairly, 
          reducing waste and building community.
        </p>
        <a href="/about" className="learnMore">Learn more about us →</a>
      </div>

      {/* Ready to Start Trading */}
      <div className="ctaSection">
        <h2>Ready to Start Trading?</h2>
        <p>Join thousands of traders finding value in what they already own.</p>
         <Link to="/signup" className="ctaButton">Create Your Account →</Link>
      </div>
    </div>
  );
}

export default Card; 