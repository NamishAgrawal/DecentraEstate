import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import EscrowABI from "../contracts/Escrow.json";
import addresses from "../contracts/addresses.json";

const CONTRACT_ADDRESS = addresses.Escrow;

const PropertyCard = ({ property, isOwner }) => {
  const { account } = useWallet();
  const isConnected = !!account;

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

  const sellProp = async () => {
    alert("Sell functionality coming soon!");
    // Implement selling logic here later.
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
          onClick={sellProp}
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
    </div>
  );
};

export default PropertyCard;
