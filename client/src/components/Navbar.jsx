import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import "./Navbar.css";

const Navbar = () => {
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        DecentralEstate
      </Link>
      <div className="navbar-menu">
        <Link to="/list" className="navbar-item">
          List Property
        </Link>
        <Link to="/lender-inspector" className="navbar-item">
          Lender Inspector
        </Link>
        <Link to="/add-lender-inspector" className="navbar-item">
          Add Lender Inspector
        </Link>
        <Link to="/dashboard" className="navbar-item">
          Dashboard
        </Link>
        <button 
          onClick={connectWallet} 
          className="connect-wallet-btn"
        >
          {walletAddress 
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
            : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;