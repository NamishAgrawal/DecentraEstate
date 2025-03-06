import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import { useWallet } from "../context/WalletContext";
import addresses from "../contracts/addresses.json";
import './LenderInspector.css'; 

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
                const isLenderApproved = await contract.lender_approved(id);
                const isLenderPaid = await contract.lender_paid(id);
                const listingPrice = (await contract.listing_price(id)).toString();
                const escrowAmount = (await contract.escrow_amount(id)).toString();
                console.log("listing", listingPrice);
                console.log("escrow", escrowAmount);

                const amountToPayinWEI = BigInt(listingPrice) - BigInt(escrowAmount);
                const amountToPay = ethers.formatEther(amountToPayinWEI.toString());
                console.log("amountToPay", amountToPay.toString());


                if (!isLenderApproved || !isInspectorApproved) {
                    pendingList.push({ id, isLenderApproved, isInspectorApproved });
                }

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
                const tx = await contract.approveProperty(id);
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
            // const amountInWei = ethers.parseUnits(amount.toString(), "ether");
            const tx = await contract.depositLendMoney(id, { value: amount });
            await tx.wait();
            
        } catch (error) {
            console.error(error);
            setErrorM("Payment failed. Ensure you have enough funds.");
        }
    };
    return (
        <div className="lender-inspector-container">
            <h2 className="section-title">Lender & Inspector Approvals</h2>
            <div className="properties-grid">
                {properties.map((property) => (
                    <div key={property.id} className="property-card">
                        <div className="property-card-header">
                            <div className="property-id">Property ID: {property.id}</div>
                        </div>
                        <div className="property-card-body">
                            <div className="property-status">
                                <span>Lender Approved:</span>
                                <span className={property.isLenderApproved ? 'status-approved' : 'status-pending'}>
                                    {property.isLenderApproved ? 'Approved' : 'Pending'}
                                </span>
                            </div>
                            <div className="property-status">
                                <span>Inspector Approved:</span>
                                <span className={property.isInspectorApproved ? 'status-approved' : 'status-pending'}>
                                    {property.isInspectorApproved ? 'Approved' : 'Pending'}
                                </span>
                            </div>
                            <div>
                                {!property.isLenderApproved && (
                                    <button 
                                        onClick={() => approveProperty(property.id, "lender")} 
                                        className="approval-button lender-approve-button"
                                    >
                                        Approve as Lender
                                    </button>
                                )}
                                {!property.isInspectorApproved && (
                                    <button 
                                        onClick={() => approveProperty(property.id, "inspector")} 
                                        className="approval-button inspector-approve-button"
                                    >
                                        Approve as Inspector
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="section-title">Payable Properties</h2>
            <div className="properties-grid">
                {payableProperties.map((property) => (
                    <div key={property.id} className="property-card">
                        <div className="property-card-header">
                            <div className="property-id">Property ID: {property.id}</div>
                        </div>
                        <div className="property-card-body">
                            <div className="property-status">
                                <span>Amount to Pay:</span>
                                <span>{property.amountToPay} ETH</span>
                            </div>
                            <button 
                                onClick={() => payForProperty(property.id, ethers.parseEther(property.amountToPay))} 
                                className="approval-button payment-button"
                            >
                                Pay Property
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {ErrorM && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <span>Error: {ErrorM}</span>
                </div>
            )}
        </div>
    );
};

export default LenderInspector;