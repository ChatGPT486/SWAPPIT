// UserContext.js
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
    products: [] // ✅ global list of products
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
