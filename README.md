# 🏡 Blockchain Real Estate Trading App

## 📌 Overview
This project is a **decentralized real estate trading platform** built on Ethereum. It allows users to list, buy, and sell properties securely using smart contracts. The platform ensures transparency and trust by leveraging **escrow contracts**, **NFT-based property ownership**, and **decentralized storage (IPFS)** for metadata.

## 🚀 Features
- **NFT-based Property Ownership**: Each property is tokenized as an NFT (ERC721).
- **Smart Contract Escrow**: Ensures secure transactions.
- **Property Listing & Management**: Owners can update listings, set prices, and manage property details.
- **On-Chain Transactions**: All property trades occur on-chain for full transparency.
- **Decentralized Storage (IPFS)**: Stores property metadata like images and descriptions.

## 📜 Smart Contracts
- **RealEstate.sol** - ERC721 contract for minting and managing property NFTs.
- **Escrow.sol** - Manages secure property transactions, holds escrow amounts.

## 🛠 Tech Stack
- **Frontend**: React.js, Ethers.js
- **Blockchain**: Solidity, Hardhat, Ethereum
- **Storage**: IPFS (via Pinata)

## ⚡ Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/real-estate-blockchain.git
   cd real-estate-blockchain
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables in `.env`:
   ```
    VITE_PINATA_JWT = your pinata jwt
    VITE_GATEWAY_URL=your gateway url

   ```

## 🔨 Deploy Smart Contracts
1. Compile the contracts:
   ```sh
   npx hardhat compile
   ```
2. Deploy to a network (e.g., Goerli):
   ```sh
   npx hardhat run scripts/deploy.js --network goerli
   ```

## 📌 Running the Frontend
1. Start the React application:
   ```sh
   npm run dev
   ```

## 🔑 Usage
- **List a Property:** Owners can set a price, description, and upload metadata.
- **Buy a Property:** Buyers pay the escrow amount, and ownership is transferred upon full payment.
- **Cancel Listing:** Owners can delist properties from sale.

## 📜 Example Code Snippet
```javascript
const contract = new ethers.Contract(CONTRACT_ADDRESS, EscrowABI, signer);
const tx = await contract.list(propertyId, ethers.parseEther(price), ethers.parseEther(price * 0.2));
await tx.wait();
alert("Property listed successfully!");
```

## 📚 Additional Resources
- [Ethereum Docs](https://ethereum.org/en/developers/docs/)
- [Ethers.js](https://docs.ethers.org/)
- [Hardhat](https://hardhat.org/)

## 📌 License
This project is licensed under the MIT License.

---
### 🤝 Contributors
- **Your Name** ([@your-github](https://github.com/your-username))

Feel free to fork, improve, and contribute! 🚀

