import React, { useState } from "react";
import { pinata } from "../utils/config";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import addresses from "../contracts/addresses.json"
import "./ListProperty.css"; // Import the CSS file

const EscrowAddress = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

const ListProperty = () => {
  const { account } = useWallet();
  const [property, setProperty] = useState({
    name: "",
    address: "",
    description: "",
    image: null,
    price: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setProperty((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const uploadToIPFS = async () => {
    try {
      setIsUploading(true);
      const imageUpload = await pinata.upload.file(property.image);
      const imageUrl = await pinata.gateways.convert(imageUpload.IpfsHash);
      
      const metadata = {
        name: property.name,
        address: property.address,
        description: property.description,
        image: imageUrl,
        attributes: [
          { trait_type: "Purchase Price", value: property.price },
          { trait_type: "Type of Residence", value: property.type },
          { trait_type: "Bed Rooms", value: property.bedrooms },
          { trait_type: "Bathrooms", value: property.bathrooms },
          { trait_type: "Square Feet", value: property.squareFeet },
          { trait_type: "Year Built", value: property.yearBuilt },
        ],
      };

      // Upload metadata to IPFS
      const metadataUpload = await pinata.upload.json(metadata);
      const metadataCID = metadataUpload.IpfsHash;
      
      setIsUploading(false);
      return metadataCID;
    } catch (error) {
      console.error("IPFS Upload Failed:", error);
      setIsUploading(false);
      return null;
    }
  };

  const listPropertyOnChain = async (cid) => {
    if (!account) {
      alert("Connect wallet first!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const RealEstate = new ethers.Contract(RealEstateAddress, RealEstateABI, signer);
      
      const tx = await RealEstate.safeMint(account, cid);
      await tx.wait();
      
      setTxHash(tx.hash);
      
      let _id = await RealEstate.getnextTokenId();
      _id = Number(_id);
      
      const escrowContract = new ethers.Contract(EscrowAddress, EscrowABI, signer);
      
      const downPayment = property.price * 0.2;
      console.log("down payment = ",downPayment);
      const tx2 = await RealEstate.approve(EscrowAddress, _id - 1)
      await tx2.wait();
      
      const tx1 = await escrowContract.list(_id - 1, ethers.parseUnits(property.price.toString(), "ether"), ethers.parseUnits(downPayment.toString(),"ether"));
      await tx1.wait();
      
      alert("Successful listing complete");
    } catch (error) {
      console.error("Blockchain transaction failed:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return alert("Please connect your wallet!");
    
    const cid = await uploadToIPFS();
    if (cid) await listPropertyOnChain(cid);
  };

  return (
    <div className="property-listing-container">
      <h2 className="property-listing-title">List a Property</h2>
      <form onSubmit={handleSubmit} className="property-form">
        <input 
          type="text" 
          name="name" 
          placeholder="Property Name" 
          value={property.name} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <input 
          type="text" 
          name="address" 
          placeholder="Address" 
          value={property.address} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <textarea 
          name="description" 
          placeholder="Description" 
          value={property.description} 
          onChange={handleChange} 
          required 
          className="property-input"
        ></textarea>
        <input 
          type="file" 
          onChange={handleFileChange} 
          required 
          className="property-input file-input" 
        />
        <input 
          type="number" 
          name="price" 
          placeholder="Price in ETH" 
          value={property.price} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <input 
          type="text" 
          name="type" 
          placeholder="Residence Type" 
          value={property.type} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <input 
          type="number" 
          name="bedrooms" 
          placeholder="Bedrooms" 
          value={property.bedrooms} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <input 
          type="number" 
          name="bathrooms" 
          placeholder="Bathrooms" 
          value={property.bathrooms} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <input 
          type="number" 
          name="squareFeet" 
          placeholder="Square Feet" 
          value={property.squareFeet} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <input 
          type="number" 
          name="yearBuilt" 
          placeholder="Year Built" 
          value={property.yearBuilt} 
          onChange={handleChange} 
          required 
          className="property-input" 
        />
        <button
          type="submit"
          disabled={isUploading || !account}
          className="submit-button"
        >
          {isUploading ? "Uploading..." : account ? "List Property" : "Connect Wallet to List"}
        </button>
      </form>
      {txHash && <p className="transaction-hash">Transaction Hash: {txHash}</p>}
    </div>
  );
};

export default ListProperty;