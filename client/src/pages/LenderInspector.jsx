import { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import { useWallet } from "../context/WalletContext";
import addresses from "../contracts/addresses.json";

const EscrowAddress = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

const LenderInspector = () => {
    const { account } = useWallet();
    const [properties, setProperties] = useState([]);
    const [payableProperties, setPayableProperties] = useState([]);
    const [ErrorM, setErrorM] = useState("");

    useEffect(() => {
        const fetchPendingApprovals = async () => {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(EscrowAddress, EscrowABI, provider);
            const RealEstatecontract = new ethers.Contract(RealEstateAddress, RealEstateABI, provider);

            const totalProperties = await RealEstatecontract.getnextTokenId();
            let pendingList = [];
            let payableList = [];

            for (let id = 0; id < totalProperties; id++) {
                const isInspectorApproved = await contract.inspected(id);
                const isLenderApproved = await contract.lender_approved(id, account);
                const isLenderPaid = await contract.lender_paid(id);
                const listingPrice = (await contract.listing_price(id)).toString();
                const escrowAmount = (await contract.escrow_amount(id)).toString();
                console.log("listing", listingPrice);
                console.log("escrow", escrowAmount);

                const amountToPay = BigInt(listingPrice) - BigInt(escrowAmount);
                console.log("amountToPay", amountToPay.toString());


                // Collect properties needing approval
                if (!isLenderApproved || !isInspectorApproved) {
                    pendingList.push({ id, isLenderApproved, isInspectorApproved });
                }

                // Collect properties lender can pay for
                if (isLenderApproved && !isLenderPaid) {
                    payableList.push({ id, amountToPay });
                }
            }

            setProperties(pendingList);
            setPayableProperties(payableList);
        };

        fetchPendingApprovals();
    }, [account]);

    const approveProperty = async (id, role) => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(EscrowAddress, EscrowABI, signer);

        try {
            if (role === "lender") {
                const tx = await contract.approveProperty(id, account);
                await tx.wait();
            } else {
                const tx = await contract.inspectProperty(id);
                await tx.wait();
            }
        } catch (error) {
            setErrorM(role === "lender" ? "Only lenders can approve" : "Only inspectors can approve");
        }
    };

    const payForProperty = async (id, amount) => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(EscrowAddress, EscrowABI, signer);
        
        try {
            const amountInWei = ethers.parseUnits(amount.toString(), "ether");
            const tx = await contract.depositLendMoney(id, { value: amountInWei });
            await tx.wait();
            
        } catch (error) {
            console.error(error);
            setErrorM("Payment failed. Ensure you have enough funds.");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">Lender & Inspector Approvals</h2>
            <div className="grid grid-cols-2 gap-4">
                {properties.map((property) => (
                    <div key={property.id} className="border p-4">
                        <p>Property ID: {property.id}</p>
                        <p>Lender Approved: {property.isLenderApproved ? "✅" : "❌"}</p>
                        <p>Inspector Approved: {property.isInspectorApproved ? "✅" : "❌"}</p>
                        {!property.isLenderApproved && (
                            <button onClick={() => approveProperty(property.id, "lender")} className="bg-blue-500 p-2 text-white">
                                Approve as Lender
                            </button>
                        )}
                        {!property.isInspectorApproved && (
                            <button onClick={() => approveProperty(property.id, "inspector")} className="bg-green-500 p-2 text-white">
                                Approve as Inspector
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold mt-6">Payable Properties</h2>
            <div className="grid grid-cols-2 gap-4">
                {payableProperties.map((property) => (
                    <div key={property.id} className="border p-4">
                        <p>Property ID: {property.id}</p>
                        <p>Amount to Pay: {property.amountToPay} ETH</p>
                        <button onClick={() => payForProperty(property.id, property.amountToPay)} className="bg-purple-500 p-2 text-white">
                            Pay
                        </button>
                    </div>
                ))}
            </div>

            {ErrorM && <p className="text-red-500 mt-4">Error: {ErrorM}</p>}
        </div>
    );
};

export default LenderInspector;
