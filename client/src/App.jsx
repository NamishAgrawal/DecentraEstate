import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext.jsx"; 
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ListProperty from "./pages/ListProperty";
import LenderInspector from "./pages/LenderInspector";
import AddLenderInspector from "./pages/AddLenderInspector.jsx";
import Dashboard from "./pages/Dashboard.jsx";


function App() {
  return (
    <WalletProvider>
      <Router>
        <div>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<ListProperty />} />
            <Route path="/lender-inspector" element={<LenderInspector />} />
            <Route path="/add-lender-inspector"  element={<AddLenderInspector />} />
            <Route path="/dashboard"  element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
