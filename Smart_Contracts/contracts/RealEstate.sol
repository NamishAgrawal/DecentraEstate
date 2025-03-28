// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721, ERC721URIStorage {
    uint256 public _nextTokenId;
    address escrowAddress;
    address owner;
    modifier onlyOwner(){
        require(msg.sender == owner,"only owner can do this");
        _;
    }
    modifier onlyEscrow(){
        require(msg.sender == escrowAddress);
        _;
    }
    constructor()
        ERC721("RealEstate", "REAL")
    {
        owner = msg.sender;
    }

    function getnextTokenId()public view returns(uint){
        return _nextTokenId;
    }

    function safeMint(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function setTokenURI(uint256 id, string memory uri) external onlyEscrow {
        _setTokenURI(id,uri);
    }

    function setEscrow(address escrow) public onlyOwner{
        escrowAddress = escrow;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}