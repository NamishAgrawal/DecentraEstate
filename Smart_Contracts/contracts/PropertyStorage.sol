// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract PropertyStorage {
    mapping(uint256 => string) public propertyCIDs;
    uint256 public propertyCount;
    event PropertyListed(uint256 propertyId, string cid);

    function listProperty(string memory cid) public {
        propertyCIDs[propertyCount] = cid;
        emit PropertyListed(propertyCount, cid);
        propertyCount++;
    }

    function getPropertyCID(uint256 propertyId) public view returns (string memory) {
        return propertyCIDs[propertyId];
    }
}
