// Products.js
import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import "./Products.css";

function Products() {
  const { user, setUser } = useContext(UserContext);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    condition: "",
    price: "",
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = () => {
    setUser({
      ...user,
      products: [...user.products, formData], // ✅ adds product globally
    });
    setShowUploadForm(false);
    setFormData({
      name: "",
      description: "",
      category: "",
      subcategory: "",
      condition: "",
      price: "",
      image: null,
    });
  };

  const subcategoriesMap = {
    Electronics: ["Phones", "Laptops", "Accessories"],
    Clothing: ["Men", "Women", "Kids"],
    Books: ["Fiction", "Non-Fiction", "Educational"],
  };

  return (
    <div className="products-page">
      <h1 className="page-title">My Products</h1>
      <p className="page-description">Upload and manage the products you want to trade.</p>

      <div className="products-header">
        <button className="upload-btn" onClick={() => setShowUploadForm(true)}>
          Upload Product
        </button>
      </div>

      <div className="products-list">
        {user.products.length === 0 ? (
          <p>No products uploaded yet.</p>
        ) : (
          user.products.map((p, i) => (
            <div key={i} className="product-card">
              {p.image && <img src={p.image} alt={p.name} />}
              <h3>{p.name}</h3>
              <p>{p.description}</p> {/* ✅ identical to Marketplace */}
              <p>{p.category} - {p.subcategory} - {p.condition}</p>
              <p>${p.price}</p>
            </div>
          ))
        )}
      </div>

      {showUploadForm && (
        <div className="upload-form">
          <h2>Upload Product</h2>

          <label>Product Images</label>
          <div className="image-upload-box">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <span>Click to upload images</span>
          </div>

          <label>Product Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} />

          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} />

          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">Select category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
          </select>

          {formData.category && (
            <>
              <label>Subcategory</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
              >
                <option value="">Select subcategory</option>
                {subcategoriesMap[formData.category].map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            </>
          )}

          <label>Condition</label>
          <select name="condition" value={formData.condition} onChange={handleChange}>
            <option value="">Select condition</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>

          <label>Your Estimated Value ($)</label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} />

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowUploadForm(false)}>Cancel</button>
            <button className="continue-btn" onClick={handleSubmit}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
