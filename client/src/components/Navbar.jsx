import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

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
        <nav className="bg-blue-600 p-4 shadow-md flex justify-between items-center">
            {/* Left: Logo & Navigation Links */}
            <div className="flex space-x-4">
                <Link to="/" className="text-white text-lg font-semibold">
                    DecentraEstate
                </Link>
                <Link to="/list" className="text-white text-lg">
                    List Property
                </Link>
                <Link to="/lender-inspector" className="text-white text-lg">
                    Lender Inspector
                </Link>
                <Link to="/dashboard" className = "text-white text-lg">
                    Dashboard
                </Link>
            </div>

            {/* Right: Connect Wallet Button */}
            <button
                onClick={connectWallet}
                className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg shadow-md"
            >
                {walletAddress ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : "Connect Wallet"}
            </button>
        </nav>
    );
};

export default Navbar;
