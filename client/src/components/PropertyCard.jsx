import { ethers } from "ethers";
import { pinata } from "../utils/config";
import { useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import addresses from "../contracts/addresses.json";
import "./PropertyCard.css"; // Import the CSS file

const CONTRACT_ADDRESS = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

const PropertyCard = ({ property, isOwner }) => {
  const { account } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newName, setNewName] = useState("");

  const isConnected = !!account;

  const handleSellClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleListProperty = async () => {
    if (!newPrice || !newDescription || !newName) {
      alert("Please fill in all fields.");
      return;
    }
  
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const escrowContract = new ethers.Contract(CONTRACT_ADDRESS, EscrowABI, signer);
      const realEstateContract = new ethers.Contract(RealEstateAddress, RealEstateABI, signer);
      const updatedMetadata = {
        name: newName,
        address: property.address, 
        description: newDescription,
        image: property.image,
        attributes: [
          { trait_type: "Purchase Price", value: newPrice },
          { trait_type: "Type of Residence", value: property.attributes.find(attr => attr.trait_type === "Type of Residence")?.value },
          { trait_type: "Bed Rooms", value: property.attributes.find(attr => attr.trait_type === "Bed Rooms")?.value },
          { trait_type: "Bathrooms", value: property.attributes.find(attr => attr.trait_type === "Bathrooms")?.value },
          { trait_type: "Square Feet", value: property.attributes.find(attr => attr.trait_type === "Square Feet")?.value },
          { trait_type: "Year Built", value: property.attributes.find(attr => attr.trait_type === "Year Built")?.value },
        ],
      };
      const metadataUpload = await pinata.upload.json(updatedMetadata);
      const newCID = metadataUpload.IpfsHash;
  
      const tx = await realEstateContract.setTokenURI(property.id, newCID);
      await tx.wait();
  
      const downPayment = Math.round(newPrice * 0.2);
      const owner = await realEstateContract.ownerOf(property.id);
      if(owner.toLowerCase() === account.toLowerCase()){
        const tx2 = await realEstateContract.approve(CONTRACT_ADDRESS, property.id);
        await tx2.wait();
        const tx1 = await escrowContract.list(property.id, newPrice, downPayment);
        await tx1.wait();
      }
      else{
        const tx1 = await escrowContract.updatelisting(property.id, newPrice, downPayment);
        await tx1.wait();
      }
      
      alert("Property successfully re-listed!");
      setShowModal(false);
    } catch (error) {
      console.error("Listing failed:", error);
      alert("Failed to list property.");
    }
  };

  const handleCancell = async () => {
    if (!isConnected) return alert("Please connect your wallet to buy!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EscrowABI, signer);
      const tx = await contract.cancellListing(property.id);
      await tx.wait();
      alert("Successfully cancelled the listing");
    }
    catch(error){
      console.error("Transaction failed:", error);
      alert("Failed to cancel listing");
    }
  };

  const buyProp = async () => {
    if (!isConnected) return alert("Please connect your wallet to buy!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EscrowABI, signer);

      const _id = property.id;
      if (_id === undefined) {
        alert("Property not found");
        return;
      }

      const amount = await contract.escrow_amount(_id);
      const amount_wei = ethers.parseUnits(amount.toString(), "ether");
      const tx = await contract.buyProperty(_id, { value: amount_wei });
      await tx.wait();
      alert("Transaction successful!");
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Failed to buy property.");
    }
  };

  return (
    <div className="property-card">
      <div className="property-card-image-container">
        <img
          src={property.image}
          alt={property.name}
          className="property-card-image"
        />
        {property.status && (
          <span className="property-card-badge">{property.status}</span>
        )}
      </div>
      
      <div className="property-content">
        <h3 className="property-title">{property.name}</h3>
        <p className="property-address">{property.address}</p>
        <p className="property-description">{property.description}</p>
        <p className="property-id">ID: {property.id}</p>

        <div className="property-attributes">
          {property.attributes.map((attr, index) => (
            <div key={index} className="property-attribute">
              <span className="attribute-label">{attr.trait_type}:</span>
              <span className="attribute-value">{attr.value}</span>
            </div>
          ))}
        </div>

        <div className="price-container">
          <p className="property-price">
            {property.attributes.find(attr => attr.trait_type === "Purchase Price")?.value} ETH
          </p>
          <p className="property-downpayment">
            Downpayment: {property.attributes.find(attr => attr.trait_type === "Purchase Price")?.value * 0.2} ETH
          </p>
        </div>

        <div className="button-container">
          {isOwner ? (
            <button
              onClick={handleSellClick}
              className="sell-button"
            >
              Sell
            </button>
          ) : (
            <button
              onClick={buyProp}
              disabled={!isConnected}
              className="buy-button"
            >
              {isConnected ? "Buy Now" : "Connect Wallet to Buy"}
            </button>
          )}
          
          {isOwner && (
            <button
              onClick={handleCancell}
              className="cancel-button"
            >
              Cancel Listing
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title">List Property for Sale</h2>
            
            <label className="form-label">New Name:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="form-input"
              placeholder="Type in the name"
            />
            
            <label className="form-label">New Listing Price (ETH):</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="form-input"
              placeholder="Enter price in ETH"
            />

            <label className="form-label">New Description:</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="form-textarea"
              placeholder="Enter new description"
            ></textarea>

            <div className="modal-actions">
              <button onClick={handleCloseModal} className="modal-cancel">
                Cancel
              </button>
              <button onClick={handleListProperty} className="modal-submit">
                List Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;