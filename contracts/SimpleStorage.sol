// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleStorage
 * @dev Store and retrieve a value
 */
contract SimpleStorage {
    uint256 private value;
    address public owner;
    
    event ValueChanged(uint256 indexed oldValue, uint256 indexed newValue, address indexed changer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(uint256 _initialValue) {
        owner = msg.sender;
        value = _initialValue;
        emit ValueChanged(0, _initialValue, msg.sender);
    }
    
    /**
     * @dev Store a value
     * @param _value The value to store
     */
    function setValue(uint256 _value) public onlyOwner {
        uint256 oldValue = value;
        value = _value;
        emit ValueChanged(oldValue, _value, msg.sender);
    }
    
    /**
     * @dev Retrieve the stored value
     * @return The stored value
     */
    function getValue() public view returns (uint256) {
        return value;
    }
    
    /**
     * @dev Increment the stored value by 1
     */
    function increment() public onlyOwner {
        uint256 oldValue = value;
        value += 1;
        emit ValueChanged(oldValue, value, msg.sender);
    }
    
    /**
     * @dev Transfer ownership to a new address
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}