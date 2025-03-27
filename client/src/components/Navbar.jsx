import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import EscrowABI from "../contracts/Escrow.json";
import addresses from "../contracts/addresses.json";
import "./Navbar.css";

const EscrowAddress = addresses.Escrow;

const Navbar = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0].toLowerCase());

      const contract = new ethers.Contract(EscrowAddress, EscrowABI, signer);
      const owner = await contract.owner();
      setOwnerAddress(owner.toLowerCase());
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

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
        {walletAddress === ownerAddress && (
          <Link to="/add-lender-inspector" className="navbar-item">
            Add Lender Inspector
          </Link>
        )}
        <Link to="/dashboard" className="navbar-item">
          Dashboard
        </Link>
        <button onClick={connectWallet} className="connect-wallet-btn">
          {walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
