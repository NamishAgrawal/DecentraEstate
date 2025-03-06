const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let realEstate, escrow;
  let deployer, seller, buyer, lender, inspector;
  let nftId = 0;
  let listingPrice = ethers.parseEther("10"); // 10 ETH
  let downPayment = ethers.parseEther("2"); // 2 ETH down payment
  let loanAmount = listingPrice - downPayment; // 8 ETH

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
    await escrow.connect(seller).list(nftId, listingPrice, downPayment);
  });

  it("should mark property as inspected", async function () {
    await escrow.connect(inspector).inspectProperty(nftId);
    expect(await escrow.inspected(nftId)).to.equal(true);
  });

  it("should allow lender to approve and deposit funds", async function () {
    await escrow.connect(lender).approveProperty(nftId);
    expect(await escrow.lender_approved(nftId)).to.equal(true);

    await escrow.connect(lender).depositLendMoney(nftId, { value: loanAmount });
    expect(await escrow.lender_paid(nftId)).to.equal(true);
  });

  it("should allow buyer to purchase property", async function () {
    // Inspector marks as inspected
    await escrow.connect(inspector).inspectProperty(nftId);

    // Lender approves buyer
    await escrow.connect(lender).approveProperty(nftId);

    // Lender deposits remaining funds
    await escrow.connect(lender).depositLendMoney(nftId, { value: loanAmount });

    // Buyer purchases the property
    await escrow.connect(buyer).buyProperty(nftId, { value: downPayment });

    // Check if ownership has been transferred
    expect(await realEstate.ownerOf(nftId)).to.equal(buyer.address);
  });

  it("should return lender's funds on cancellation", async function () {
    // Lender approves property and deposits funds
    await escrow.connect(lender).approveProperty(nftId);
    await escrow.connect(lender).depositLendMoney(nftId, { value: loanAmount });

    // Capture lender's balance before cancellation
    const lenderBalanceBefore = await ethers.provider.getBalance(lender.address);

    // Seller cancels listing
    await escrow.connect(seller).cancellListing(nftId);

    // Capture lender's balance after cancellation
    const lenderBalanceAfter = await ethers.provider.getBalance(lender.address);

    // Check that lender got refunded
    console.log("balance before",lenderBalanceBefore);
    console.log("balance after", lenderBalanceAfter);
    console.log("difference",lenderBalanceAfter-lenderBalanceBefore );
    expect(lenderBalanceAfter).to.be.gt(lenderBalanceBefore);
  });

  it("should return NFT to seller on cancellation", async function () {
    // Seller cancels listing
    await escrow.connect(seller).cancellListing(nftId);

    // Check that seller owns the NFT again
    expect(await realEstate.ownerOf(nftId)).to.equal(seller.address);
  });
});
