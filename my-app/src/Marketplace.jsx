// Marketplace.jsx
import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { Link } from "react-router-dom";
import "./Marketplace.css";
import logo from "./assets/logo.jpg";

function Marketplace() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("marketplace");

  const categories = ["All Items", "Electronics", "Clothing", "Furniture", "Sports", "Books"];
  const subcategoriesMap = {
    Electronics: ["Phones", "Laptops", "Cameras", "Audio"],
    Clothing: ["Jackets", "Shoes", "T-Shirts"],
    Furniture: ["Tables", "Chairs", "Beds"],
    Sports: ["Balls", "Shoes", "Equipment"],
    Books: ["Fiction", "Non-Fiction", "Comics"],
  };

  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = user.products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "All Items" || p.category === selectedCategory;
    const matchSubcategory = !selectedSubcategory || p.subcategory === selectedSubcategory;
    return matchSearch && matchCategory && matchSubcategory;
  });

  return (
    <div className="marketplace-page">
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

      <h1 className="page-title">Marketplace</h1>
      <p className="page-description">Browse and discover items from other users.</p>

      <div className="tabs">
        <button
          className={activeTab === "marketplace" ? "tab black" : "tab white"}
          onClick={() => setActiveTab("marketplace")}
        >
          🛒 Marketplace
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "marketplace" && (
          <>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="filter-btn">Filters</button>
            </div>

            <div className="categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={cat === selectedCategory ? "active" : ""}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory(null);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {selectedCategory !== "All Items" && subcategoriesMap[selectedCategory] && (
              <div className="subcategories-section">
                <h3 className="subcategories-title">Subcategories</h3>
                <div className="subcategories">
                  {subcategoriesMap[selectedCategory].map((sub) => (
                    <button
                      key={sub}
                      className={sub === selectedSubcategory ? "active" : ""}
                      onClick={() => setSelectedSubcategory(sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="products-list">
              {filteredProducts.length === 0 ? (
                <p>No products available.</p>
              ) : (
                filteredProducts.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="product-card">
                    {p.image && <img src={p.image} alt={p.name} />}
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <p>{p.category} - {p.subcategory} - {p.condition}</p>
                    <p>${p.price}</p>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
