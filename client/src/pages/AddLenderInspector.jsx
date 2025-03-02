import { useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../contracts/Escrow.json";
import addresses from "../contracts/addresses.json";

const EscrowAddress = addresses.Escrow;

const AddLenderInspector = () => {
    const [address, setAddress] = useState("");
    const [role, setRole] = useState("lender");

    const addRole = async () => {
        if (!ethers.isAddress(address)) {
            alert("Invalid Ethereum address");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(EscrowAddress, EscrowABI, signer);

            if (role === "lender") {
                await contract.addLender(address);
            } else {
                await contract.addInspector(address);
            }

            alert(`${role} added successfully!`);
            setAddress("");
        } catch (error) {
            console.error("Error adding:", error);
            alert("Transaction failed");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">Add Lender or Inspector</h2>
            <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                className="border p-2 w-full"
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 w-full mt-2">
                <option value="lender">Lender</option>
                <option value="inspector">Inspector</option>
            </select>
            <button onClick={addRole} className="bg-blue-500 text-white p-2 mt-2 w-full">
                Add {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
        </div>
    );
};

export default AddLenderInspector;
