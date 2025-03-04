import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";  
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import PropertyCard from "../components/PropertyCard";
import addresses from "../contracts/addresses.json";

const EscrowAddress = addresses.Escrow;
const RealEstate_Address = addresses.RealEstate;

const Home = () => {
  const { account } = useWallet(); 
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!account) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, PropertyStorageABI, provider);

        // const totalProperties = await contract.propertyCount();
        const contract = new ethers.Contract(RealEstate_Address,RealEstateABI,provider);
        const totalProperties = await contract.getnextTokenId();
        let propertyList = [];

        for (let id = 0; id < totalProperties; id++) {
          let isOwner = false;
          const escrow = new ethers.Contract(EscrowAddress,EscrowABI,provider);
          const isListed = await escrow.isListed(id);
          if(!isListed){
            continue;
          }
          const seller = await escrow.idToSeller(id);
          if(seller.toLowerCase() === account.toLowerCase()){
            isOwner = true;
          }
          const cid = await contract.tokenURI(id);

          try {
            const metadata = await fetchWithRetry(`https://gateway.pinata.cloud/ipfs/${cid}`);

            propertyList.push({ id,isOwner, ...metadata });
          } catch (fetchError) {
            console.error(`Error fetching metadata for property ${id}:`, fetchError);
          }
        }

        setProperties(propertyList);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchProperties();
  }, [account]); 

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {properties.length > 0 ? (
        properties.map((property) => <PropertyCard key={property.id} property={property} isOwner={property.isOwner} />)
      ) : (
        <p className="text-center text-gray-500 col-span-full">No properties listed yet.</p>
      )}
      
    </div>
  );
};

export default Home;

/**
 * Fetch helper with retry mechanism
 */
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching: ${url} (Attempt ${i + 1})`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error(`Fetch failed (${i + 1}/${retries}):`, error);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
};
