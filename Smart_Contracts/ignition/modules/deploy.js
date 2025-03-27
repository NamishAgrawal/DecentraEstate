import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RealEstateDeployment", (m) => {
    const propertyStorage = m.contract("PropertyStorage");
    const realEstate = m.contract("RealEstate");
    const escrow = m.contract("Escrow", [realEstate]);

    return { propertyStorage, realEstate, escrow };
});
