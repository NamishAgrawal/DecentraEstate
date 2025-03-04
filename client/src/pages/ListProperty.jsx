import { useState } from "react";
import { pinata } from "../utils/config"; 
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import PropertyStorageABI from "../contracts/PropertyStorage.json";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const EscrowAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const RealEstateAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

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
      console.log(account)
      const RealEstate = new ethers.Contract(RealEstateAddress, RealEstateABI, signer);
      const tx = await RealEstate.safeMint(account, cid);
      await tx.wait();
      setTxHash(tx.hash);
      let _id = await RealEstate.getnextTokenId();
      _id = Number(_id);
      const escrowContract = new ethers.Contract(EscrowAddress, EscrowABI, signer);
      const downPayment = Math.round(property.price * 0.2);
      console.log(property.price);
      console.log(downPayment);
      console.log(_id);
      const tx2 = await RealEstate.approve(EscrowAddress, _id - 1)
      await tx2.wait();
      const tx1 = await escrowContract.list(_id - 1, property.price, downPayment);
      await tx1.wait();
      alert("successfull listing complete");
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
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">List a Property</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder="Property Name" value={property.name} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input type="text" name="address" placeholder="Address" value={property.address} onChange={handleChange} required className="w-full p-2 border rounded" />
        <textarea name="description" placeholder="Description" value={property.description} onChange={handleChange} required className="w-full p-2 border rounded"></textarea>
        <input type="file" onChange={handleFileChange} required className="w-full p-2 border rounded" />
        <input type="number" name="price" placeholder="Price in ETH" value={property.price} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input type="text" name="type" placeholder="Residence Type" value={property.type} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input type="number" name="bedrooms" placeholder="Bedrooms" value={property.bedrooms} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input type="number" name="bathrooms" placeholder="Bathrooms" value={property.bathrooms} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input type="number" name="squareFeet" placeholder="Square Feet" value={property.squareFeet} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input type="number" name="yearBuilt" placeholder="Year Built" value={property.yearBuilt} onChange={handleChange} required className="w-full p-2 border rounded" />

        <button
          type="submit"
          disabled={isUploading || !account}
          className={`w-full p-2 rounded ${account ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-400 cursor-not-allowed"}`}
        >
          {isUploading ? "Uploading..." : account ? "List Property" : "Connect Wallet to List"}
        </button>
      </form>

      {txHash && <p className="text-green-500 mt-4">Transaction Hash: {txHash}</p>}
    </div>
  );
};

export default ListProperty;
