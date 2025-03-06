import { useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../contracts/Escrow.json";
import addresses from "../contracts/addresses.json";
import "./AddLenderInspector.css"; // Import the CSS file

const EscrowAddress = addresses.Escrow;

const AddLenderInspector = () => {
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("lender");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const addRole = async () => {
    if (!ethers.isAddress(address)) {
      setMessage({ text: "Invalid Ethereum address", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(EscrowAddress, EscrowABI, signer);
      
      if (role === "lender") {
        await contract.addLender(address);
      } else {
        await contract.addInspector(address);
      }
      
      setMessage({ 
        text: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully!`, 
        type: "success" 
      });
      setAddress("");
    } catch (error) {
      console.error("Error adding:", error);
      setMessage({ 
        text: error.reason || "Transaction failed", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = role === "lender" ? "ADD LENDER" : "ADD INSPECTOR";

  return (
    <div className="add-lender-container">
      <h2 className="section-header">Add Lender or Inspector</h2>
      
      <div className="form-group">
        <label className="form-label">Ethereum Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="form-input"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Role</label>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          className="form-select"
        >
          <option value="lender">Lender</option>
          <option value="inspector">Inspector</option>
        </select>
      </div>
      
      {message.text && (
        <div className={`message ${message.type === "success" ? "message-success" : "message-error"}`}>
          {message.text}
        </div>
      )}
      
      <button 
        onClick={addRole} 
        disabled={isLoading || !address}
        className={`btn btn-primary ${address ? "active" : ""}`}
      >
        {isLoading ? (
          <>
            <span className="loading-indicator"></span>
            PROCESSING...
          </>
        ) : (
          buttonText
        )}
      </button>
      
      <p className="info-text">
        Only approved addresses can be added as lenders or inspectors to the escrow contract.
      </p>
    </div>
  );
};

export default AddLenderInspector;