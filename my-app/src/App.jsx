import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Card";
import Signup from "./Signup";
import Signin from "./Signin";
import About from "./About";
import Profile from "./Profile";
import Products from "./Products";
import Marketplace from "./Marketplace";
import ProductDetails from "./ProductDetails";
import ProposeExchange from "./ProposeExchange";
import { UserProvider } from "./UserContext";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/products" element={<Products />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetails />} />   {/* ✅ */}
          <Route path="/exchange/:id" element={<ProposeExchange />} /> {/* ✅ */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
