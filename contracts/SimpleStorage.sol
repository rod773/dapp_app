// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleStorage {
    uint256 private _value;

    event ValueStored(uint256 indexed newValue, address indexed sender);

    function store(uint256 newValue) public {
        _value = newValue;
        emit ValueStored(newValue, msg.sender);
    }

    function retrieve() public view returns (uint256) {
        return _value;
    }
}
