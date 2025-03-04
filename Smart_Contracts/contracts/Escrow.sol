// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    mapping(uint256 => address) public idToSeller;
    mapping(address => bool) public lender;
    mapping(address => bool) public inspector;
    mapping(uint256 => uint256) public listing_price;
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => bool) public inspected;
    mapping(uint256 => uint256) public escrow_amount;
    mapping(uint256 => mapping(address => bool)) public lender_approved;
    mapping(uint256 => bool) public lender_paid;
    mapping(uint256 => bool) public buyer_paid;

    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier onlyInspector() {
        require(inspector[msg.sender], "Only inspector can call this function");
        _;
    }

    modifier onlyLender() {
        require(lender[msg.sender], "Only lender can call this function");
        _;
    }

    modifier onlySeller(uint256 _id) {
        require(
            msg.sender == idToSeller[_id],
            "Only seller can call this function"
        );
        _;
    }

    constructor(address _nftAddress) {
        nftAddress = _nftAddress;
        owner = msg.sender;
    }

    function addInspector(address _ins) public onlyOwner {
        inspector[_ins] = true;
    }

    function addLender(address _lender) public onlyOwner {
        lender[_lender] = true;
    }

    function list(uint256 _id, uint256 _price, uint256 _downPayment) public {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _id);
        isListed[_id] = true;
        idToSeller[_id] = msg.sender;
        listing_price[_id] = _price;
        escrow_amount[_id] = _downPayment;
    }

    function updatelisting(
        uint256 _id,
        uint256 _price,
        uint256 _downPayment
    ) public {
        require(isListed[_id], "it is not listed");
        require(idToSeller[_id] == msg.sender, "you are not the seller");
        listing_price[_id] = _price;
        escrow_amount[_id] = _downPayment;
    }

    function inspectProperty(uint256 _id) public onlyInspector {
        require(isListed[_id], "The item is not yet listed");
        inspected[_id] = true;
    }

    function approveProperty(uint256 _id, address _buyer) public onlyLender {
        require(isListed[_id], "The item is not yet listed");
        lender_approved[_id][_buyer] = true;
    }

    function depositLendMoney(uint256 _id) public payable onlyLender {
        require(isListed[_id], "The item is not yet listed");
        require(
            msg.value >= listing_price[_id] - escrow_amount[_id],
            "Not enough funds sent"
        );
        lender_paid[_id] = true;
    }

    function buyProperty(uint256 _id) public payable {
        require(isListed[_id], "The item is not yet listed");
        require(inspected[_id], "Inspection not complete");
        require(
            lender_approved[_id][msg.sender],
            "Lender has not approved the transaction"
        );
        require(msg.value >= escrow_amount[_id], "Not enough down payment");

        buyer_paid[_id] = true;
        require(lender_paid[_id], "Lender has not paid yet");
        require(
            address(this).balance >= listing_price[_id],
            "Not enough funds in escrow"
        );

        address seller = idToSeller[_id];

        // Transfer funds to the seller
        payable(seller).transfer(listing_price[_id]);

        // Transfer NFT to buyer
        IERC721(nftAddress).transferFrom(address(this), msg.sender, _id);

        // Mark as sold
        isListed[_id] = false;
        delete idToSeller[_id];
        delete listing_price[_id];
        delete escrow_amount[_id];
        delete inspected[_id];
        delete lender_approved[_id][msg.sender];
        delete buyer_paid[_id];
        delete lender_paid[_id];
    }

    function cancellListing(uint _id) public onlySeller(_id) {
        isListed[_id] = false;
        delete idToSeller[_id];
        delete listing_price[_id];
        delete escrow_amount[_id];
        delete inspected[_id];
        delete lender_approved[_id][msg.sender];
        delete buyer_paid[_id];
        delete lender_paid[_id];
        IERC721(nftAddress).transferFrom(address(this),msg.sender, _id);
    }
}
