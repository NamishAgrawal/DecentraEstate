import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext.jsx"; 
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ListProperty from "./pages/ListProperty";

function App() {
  return (
    <WalletProvider>
      <Router>
        <div>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<ListProperty />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
