import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import EscrowABI from "../contracts/Escrow.json";

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";


const PropertyCard = ({ property }) => {
  const { account } = useWallet();
  const isConnected = !!account; 

  const buyProp = async () =>{
    if (!isConnected) return alert("Please connect your wallet to buy!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EscrowABI, signer);


      
    }
    catch (error) {
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
      <button 
        
        disabled={!isConnected}
        className={`mt-3 w-full p-2 rounded-lg text-white font-semibold ${
          isConnected ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {isConnected ? "Buy Now" : "Connect Wallet to Buy"}
      </button>
    </div>
  );
};

export default PropertyCard;
