import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "./UserContext";
import "./Marketplace.css";

function ProposeExchange() {
  const { id } = useParams();
  const { user } = useContext(UserContext);

  const product = user.products.find((p) => p.id.toString() === id);

  if (!product) return <p>Product not found.</p>;

  return (
    <div className="exchange-core">
      <h2>Propose Exchange for {product.name}</h2>
      <p>Price: ${product.price}</p>

      <div className="calc-section">
        <p>👉 Ici tu peux mettre tes calculs (ex: comparer prix, valeur estimée, etc.)</p>
      </div>
    </div>
  );
}

export default ProposeExchange;
