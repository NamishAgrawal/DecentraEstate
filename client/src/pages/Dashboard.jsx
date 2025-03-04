import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import RealEstateABI from "../contracts/RealEstate.json";
import EscrowABI from "../contracts/Escrow.json";
import addresses from "../contracts/addresses.json";
import PropertyCard from "../components/PropertyCard";

const EscrowAddress = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

const Dashboard = () => {
    const { account } = useWallet();
    const [ownedProperties, setOwnedProperties] = useState([]);
    const [ListedProperties, setListed] = useState([]);
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
                    const owner = await contract.ownerOf(id);
                    console.log("owner is ", owner);
                    if (owner.toLowerCase() === account.toLowerCase()) {
                        const tokenURI = await contract.tokenURI(id);
                        console.log(`Fetching metadata from: ${tokenURI}`);
                        const metadata = await fetchMetadata(tokenURI);
                        userProperties.push({ id, ...metadata });
                    }

                    else if (owner.toLowerCase() === EscrowAddress.toLocaleLowerCase()) {
                        const seller = await escrow.idToSeller(id);
                        console.log("seller address", seller);
                        if (seller.toLowerCase() === account.toLowerCase()) {
                            const tokenURI = await contract.tokenURI(id);
                            console.log(`Fetching metadata from: ${tokenURI}`);
                            const metadata = await fetchMetadata(tokenURI);
                            listedProperties.push({ id, ...metadata });
                        }
                    }
                }
                setListed(listedProperties);
                setOwnedProperties(userProperties);
            } catch (error) {
                console.error("Error fetching owned properties:", error);
            }
            setLoading(false);
        };

        fetchOwnedProperties();
    }, [account]);

    // Fetch metadata from IPFS
    const fetchMetadata = async (tokenURI) => {
        try {
            tokenURI = "https://ipfs.io/ipfs/" + tokenURI;
            const response = await fetch(tokenURI);
            console.log(response);
            return await response.json();
        } catch (error) {
            console.error("Error fetching metadata:", error);
            return {};
        }
    };

    return (
        <div className="p-6">
            <div>
                <h1 className="text-2xl font-bold mb-4">My Properties</h1>
                {loading ? (
                    <p>Loading properties...</p>
                ) : ownedProperties.length === 0 ? (
                    <p>You don't own any properties yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ownedProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} isOwner={true} />
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold mb-4">My Listed Properties</h1>
                {loading ? (
                    <p>Loading properties...</p>
                ) : ListedProperties.length === 0 ? (
                    <p>You don't own any properties yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ListedProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} isOwner={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
