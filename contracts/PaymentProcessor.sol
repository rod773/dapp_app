// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PaymentProcessor {
    struct Payment {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        string productId;
        string productName;
        uint256 timestamp;
    }

    uint256 private _nextPaymentId;
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) private _buyerPaymentIds;
    mapping(address => uint256[]) private _sellerPaymentIds;

    event PaymentProcessed(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string productId,
        string productName,
        uint256 timestamp
    );

    function pay(address seller, string calldata productId, string calldata productName) external payable {
        require(msg.value > 0, "Payment must be greater than 0");
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Cannot pay yourself");

        uint256 id = _nextPaymentId++;

        payments[id] = Payment({
            id: id,
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            productId: productId,
            productName: productName,
            timestamp: block.timestamp
        });

        _buyerPaymentIds[msg.sender].push(id);
        _sellerPaymentIds[seller].push(id);

        (bool sent, ) = payable(seller).call{value: msg.value}("");
        require(sent, "Transfer to seller failed");

        emit PaymentProcessed(id, msg.sender, seller, msg.value, productId, productName, block.timestamp);
    }

    function getBuyerPayments() external view returns (Payment[] memory) {
        uint256[] storage ids = _buyerPaymentIds[msg.sender];
        Payment[] memory result = new Payment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = payments[ids[i]];
        }
        return result;
    }

    function getSellerPayments(address seller) external view returns (Payment[] memory) {
        uint256[] storage ids = _sellerPaymentIds[seller];
        Payment[] memory result = new Payment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = payments[ids[i]];
        }
        return result;
    }

    function getPaymentCount() external view returns (uint256) {
        return _nextPaymentId;
    }
}
