import { ethers } from "ethers";
import { pinata } from "../utils/config";
import { useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import addresses from "../contracts/addresses.json";

const CONTRACT_ADDRESS = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

const PropertyCard = ({ property, isOwner }) => {
  const { account } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const[newName,setNewName] = useState("");

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
  
      const tx = await realEstateContract.setTokenURI(property.id,newCID);
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
        const tx1 = await escrowContract.updatelisting(property.id,newPrice,downPayment);
        await tx1.wait();
      }
      
      alert("Property successfully re-listed!");
    } catch (error) {
      console.error("Listing failed:", error);
      alert("Failed to list property.");
    }
  };

  const handleCancell = async()=>{
    if (!isConnected) return alert("Please connect your wallet to buy!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EscrowABI, signer);
      const tx = await contract.cancellListing(property.id);
      await tx.wait();
      alert("successfuly cancelled the listing");
    }
    catch(error){
      console.error("Transaction failed:", error);
      alert("Failed to cancell Listing");
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
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center w-80">
      <img
        src={property.image}
        alt={property.name}
        className="w-full max-w-[250px] h-[180px] object-cover rounded-lg"
      />

      <h3 className="text-lg font-semibold mt-2 text-center">{property.name}</h3>
      <p className="text-gray-500 text-sm text-center">{property.address}</p>
      <p className="text-gray-600 text-sm text-center mt-2">{property.description}</p>
      <p className="text-gray-600 text-sm text-center mt-2">ID: {property.id}</p>

      <div className="mt-2 text-sm w-full">
        {property.attributes.map((attr, index) => (
          <div key={index} className="flex justify-between w-full border-b py-1">
            <span className="text-gray-700 font-medium">{attr.trait_type}:</span>
            <span className="text-gray-900 font-semibold">{attr.value}</span>
          </div>
        ))}
      </div>

      <p className="text-blue-500 font-semibold mt-2 text-center">
        Price: {property.attributes.find(attr => attr.trait_type === "Purchase Price")?.value} ETH
      </p>
      <p className="text-blue-500 font-semibold mt-2 text-center">
        Downpayment: {property.attributes.find(attr => attr.trait_type === "Purchase Price")?.value * 0.2} ETH
      </p>

      {isOwner ? (
        <button
          onClick={handleSellClick}
          className="mt-3 w-full p-2 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600"
        >
          Sell
        </button>
      ) : (
        <button
          onClick={buyProp}
          disabled={!isConnected}
          className={`mt-3 w-full p-2 rounded-lg text-white font-semibold ${
            isConnected ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isConnected ? "Buy Now" : "Connect Wallet to Buy"}
        </button>
      )}
      {isOwner?(
        <button
        onClick={handleCancell}
        className="mt-3 w-full p-2 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600"
      >
        Cancell Listing
      </button>
      ):(<p></p>)}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">List Property for Sale</h2>
            <label className="block text-gray-700 font-medium">New Name:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded-md mb-3"
              placeholder="Type in the name"
            />
            <label className="block text-gray-700 font-medium">New Listing Price (ETH):</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full p-2 border rounded-md mb-3"
              placeholder="Enter price in ETH"
            />

            <label className="block text-gray-700 font-medium">New Description:</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full p-2 border rounded-md mb-3"
              placeholder="Enter new description"
            ></textarea>

            <div className="flex justify-between mt-4">
              <button onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                Cancel
              </button>
              <button onClick={handleListProperty} className="bg-blue-500 text-white px-4 py-2 rounded-md">
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
