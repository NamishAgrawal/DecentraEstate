import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RealEstateDeployment", (m) => {
    const realEstate = m.contract("contracts/RealEstate.sol:RealEstate");
    const escrow = m.contract("contracts/Escrow.sol:Escrow", [realEstate]);
    m.call(realEstate, "setEscrow", [escrow]);
    return { realEstate, escrow };
});
