import React, { createContext, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    firstName: "Pamsy",
    lastName: "User",
    email: "pamsy@example.com",
    contact: "123456789",
    bio: "Trader on TradeHub",
    photo: "/assets/default-profile.png",
    products: [] // ✅ liste globale des produits
  });

  // ✅ fonction pour ajouter un produit avec id auto
  const addProduct = (newProduct) => {
    setUser((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { ...newProduct, id: Date.now() } // génère un id unique
      ]
    }));
  };

  return (
    <UserContext.Provider value={{ user, setUser, addProduct }}>
      {children}
    </UserContext.Provider>
  );
};
