import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import PropertyCard from "../components/PropertyCard";
import addresses from "../contracts/addresses.json";
import { FaHome } from 'react-icons/fa';
import "./Home.css";

const EscrowAddress = addresses.Escrow;
const RealEstate_Address = addresses.RealEstate;

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
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

const Home = () => {
  const { account } = useWallet();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!account) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(RealEstate_Address, RealEstateABI, provider);
        const escrow = new ethers.Contract(EscrowAddress, EscrowABI, provider);
        
        const totalProperties = await contract.getnextTokenId();
        let propertyList = [];
        
        for (let id = 0; id < totalProperties; id++) {
          try {
            const isListed = await escrow.isListed(id);
            if (!isListed) continue;
            
            const seller = await escrow.idToSeller(id);
            const isOwner = seller.toLowerCase() === account.toLowerCase();
            const price = await escrow.listing_price(id);
            const cid = await contract.tokenURI(id);
            
            try {
              const metadata = await fetchWithRetry(`https://gateway.pinata.cloud/ipfs/${cid}`);
              propertyList.push({ 
                id, 
                isOwner, 
                price: price.toString(), 
                ...metadata 
              });
            } catch (fetchError) {
              console.error(`Error fetching metadata for property ${id}:`, fetchError);
            }
          } catch (propError) {
            console.error(`Error processing property ${id}:`, propError);
          }
        }
        
        setProperties(propertyList);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Failed to load properties. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [account]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="empty-state text-center">
          <FaHome className="empty-state-icon mx-auto" size={48} />
          <div className="empty-state-text">{error}</div>
          <button className="connect-button mt-4" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto p-4">
        <div className="empty-state text-center">
          <FaHome className="empty-state-icon mx-auto" size={48} />
          <div className="empty-state-text">Please connect your wallet to view properties</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Available Properties</h1>
      <div className="property-grid">
        {properties.length > 0 ? (
          properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              isOwner={property.isOwner} 
            />
          ))
        ) : (
          <div className="empty-state col-span-full text-center">
            <FaHome className="empty-state-icon mx-auto" size={48} />
            <div className="empty-state-text">No properties listed yet.</div>
            <button className="connect-button mt-4">List Your Property</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
