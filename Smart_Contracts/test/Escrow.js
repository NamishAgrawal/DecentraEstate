const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let realEstate, escrow;
  let deployer, seller, buyer, lender, inspector;
  let nftId = 0; // First minted NFT will have ID 0

  beforeEach(async function () {
    // Get signers
    [deployer, seller, buyer, lender, inspector] = await ethers.getSigners();

    // Deploy the RealEstate (NFT) contract
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();

    // Deploy the Escrow contract with the address of the RealEstate contract
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(await realEstate.getAddress());
    await escrow.waitForDeployment();

    // Add inspector and lender roles
    await escrow.connect(deployer).addInspector(inspector.address);
    await escrow.connect(deployer).addLender(lender.address);

    // Seller mints an NFT
    await realEstate.connect(seller).safeMint(seller.address, "ipfs://some-nft-uri");

    // Approve escrow to transfer NFT
    await realEstate.connect(seller).approve(await escrow.getAddress(), nftId);

    // Seller lists the NFT in Escrow
    const listingPrice = ethers.parseEther("10"); // 10 ETH
    const downPayment = ethers.parseEther("2"); // 2 ETH down payment
    await escrow.connect(seller).list(nftId, listingPrice, downPayment);
  });

  it("should mark property as inspected", async function () {
    await escrow.connect(inspector).inspectProperty(nftId);
    expect(await escrow.inspected(nftId)).to.equal(true);
  });

  it("should allow lender to approve and deposit funds", async function () {
    await escrow.connect(lender).approveProperty(nftId, buyer.address);
    expect(await escrow.lender_approved(nftId, buyer.address)).to.equal(true);

    await escrow.connect(lender).depositLendMoney(nftId, { value: ethers.parseEther("8") });
    expect(await escrow.lender_paid(nftId)).to.equal(true);
  });

  it("should allow buyer to purchase property", async function () {
    // Inspector marks as inspected
    await escrow.connect(inspector).inspectProperty(nftId);

    // Lender approves buyer
    await escrow.connect(lender).approveProperty(nftId, buyer.address);

    // Lender deposits remaining funds
    await escrow.connect(lender).depositLendMoney(nftId, { value: ethers.parseEther("8") });

    // Buyer purchases the property
    await escrow.connect(buyer).buyProperty(nftId, { value: ethers.parseEther("2") });

    // Check if ownership has been transferred
    expect(await realEstate.ownerOf(nftId)).to.equal(buyer.address);
  });
});
