import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import RealEstateABI from "../contracts/RealEstate.json";
import EscrowABI from "../contracts/Escrow.json";
import addresses from "../contracts/addresses.json";
import PropertyCard from "../components/PropertyCard";
import "./Dashboard.css"; 

const EscrowAddress = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

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

const Dashboard = () => {
    const { account } = useWallet();
    const [ownedProperties, setOwnedProperties] = useState([]);
    const [listedProperties, setListedProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!account) return;

        const fetchOwnedProperties = async () => {
            setLoading(true);
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const contract = new ethers.Contract(RealEstateAddress, RealEstateABI, provider);
                const escrow = new ethers.Contract(EscrowAddress, EscrowABI, provider);
                const totalProperties = await contract.getnextTokenId();
                let userProperties = [];
                let listedProperties = [];

                for (let id = 0; id < totalProperties; id++) {
                    try {
                        const owner = await contract.ownerOf(id);

                        if (owner.toLowerCase() === account.toLowerCase()) {
                            const cid = await contract.tokenURI(id);
                            const metadata = await fetchWithRetry(`https://gateway.pinata.cloud/ipfs/${cid}`);
                            userProperties.push({ id, ...metadata });
                        } else if (owner.toLowerCase() === EscrowAddress.toLowerCase()) {
                            const seller = await escrow.idToSeller(id);
                            if (seller.toLowerCase() === account.toLowerCase()) {
                                const cid = await contract.tokenURI(id);
                                const metadata = await fetchWithRetry(`https://gateway.pinata.cloud/ipfs/${cid}`);
                                listedProperties.push({ id, ...metadata });
                            }
                        }
                    } catch (propError) {
                        console.error(`Error processing property ${id}:`, propError);
                    }
                }

                setOwnedProperties(userProperties);
                setListedProperties(listedProperties);
            } catch (error) {
                console.error("Error fetching owned properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnedProperties();
    }, [account]);

    if (!account) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p>Please connect your wallet to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div>
                <h1 className="text-2xl font-bold mb-4">My Properties</h1>
                {loading ? (
                    <p>Loading properties...</p>
                ) : ownedProperties.length === 0 ? (
                    <p>You don't own any properties yet.</p>
                ) : (
                    <div className="property-grid">
                        {ownedProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} isOwner={true} />
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold mb-4 mt-8">My Listed Properties</h1>
                {loading ? (
                    <p>Loading properties...</p>
                ) : listedProperties.length === 0 ? (
                    <p>You have no listed properties.</p>
                ) : (
                    <div className="property-grid">
                        {listedProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} isOwner={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
