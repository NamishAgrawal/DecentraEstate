import { ethers } from "ethers";

const ESCROW_CONTRACT_ADDRESS = "0xYourEscrowContractAddress";
const NFT_CONTRACT_ADDRESS = "0xYourNFTContractAddress";

const ESCROW_ABI = [/* Your Escrow Contract ABI Here */];
const NFT_ABI = [/* Your NFT Contract ABI Here */];

const getContract = (contractAddress, abi, provider) => {
    return new ethers.Contract(contractAddress, abi, provider);
};

export { ESCROW_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS, ESCROW_ABI, NFT_ABI, getContract };
