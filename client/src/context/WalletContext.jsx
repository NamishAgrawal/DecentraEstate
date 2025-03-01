import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is required!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      // ✅ Force re-render when account changes
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
      });

    } catch (error) {
      console.error("Wallet Connection Failed:", error);
    }
  };

  useEffect(() => {
    connectWallet(); // Auto-connect if user is already logged in
  }, []);

  return (
    <WalletContext.Provider value={{ account, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
