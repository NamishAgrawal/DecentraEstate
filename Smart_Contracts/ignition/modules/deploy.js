import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RealEstateDeployment", (m) => {
    // 1️⃣ Deploy PropertyStorage
    const propertyStorage = m.contract("PropertyStorage");

    // 2️⃣ Deploy RealEstate (ERC721)
    const realEstate = m.contract("RealEstate");

    // 3️⃣ Deploy Escrow with RealEstate Address as Constructor Arg
    const escrow = m.contract("Escrow", [realEstate]);

    return { propertyStorage, realEstate, escrow };
});
