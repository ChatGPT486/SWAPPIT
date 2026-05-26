import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const product = user.products.find((p) => p.id.toString() === id);

  if (!product) return <p>Product not found.</p>;

  const similarItems = user.products.filter(
    (p) =>
      p.id !== product.id &&
      (p.category === product.category || p.subcategory === product.subcategory)
  );

  return (
    <div className="product-details">
      {/* ✅ Deux colonnes séparées */}
      <div className="details-row">
        <div className="details-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="details-info">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Subcategory:</strong> {product.subcategory || "N/A"}</p>
          <p><strong>Condition:</strong> {product.condition}</p>
          <p><strong>Price:</strong> ${product.price}</p>

          <div className="seller-info">
            <p><strong>Seller:</strong> {product.seller || "Unknown"}</p>
          </div>

          <button
            className="exchange-btn long-btn"
            onClick={() => navigate(`/exchange/${product.id}`)}
          >
            Propose Exchange
          </button>

          <button className="back-btn" onClick={() => navigate("/marketplace")}>
            Back to Marketplace
          </button>
        </div>
      </div>

      {/* ✅ Similar Items en bas */}
      <div className="similar-items">
        <h3>Similar Items</h3>
        <div className="products-list">
          {similarItems.map((p) => (
            <div key={p.id} className="product-card">
              <img src={p.image} alt={p.name} />
              <h3>{p.name}</h3>
              <p>${p.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
