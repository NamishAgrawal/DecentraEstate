import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../contracts/Escrow.json";
import RealEstateABI from "../contracts/RealEstate.json";
import { useWallet } from "../context/WalletContext";
import addresses from "../contracts/addresses.json";
import './LenderInspector.css'; // Import the CSS file

const EscrowAddress = addresses.Escrow;
const RealEstateAddress = addresses.RealEstate;

const LenderInspector = () => {
    const { account } = useWallet();
    const [properties, setProperties] = useState([]);
    const [payableProperties, setPayableProperties] = useState([]);
    const [ErrorM, setErrorM] = useState("");

    // ... (keep the existing useEffect and methods)

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
                                onClick={() => payForProperty(property.id, property.amountToPay)} 
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