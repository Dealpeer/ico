pragma solidity ^0.4.18;

import "./token/MintableToken.sol";
import "./security/ArgumentsChecker.sol";

contract DPRToken is MintableToken, ArgumentsChecker {
    
    string public name = "DealPeer Token";
    string public symbol = "DPR";
    uint public decimals = 18;
    bool public paused = true;

    event Unpause();

    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    function DPRToken(address[] _owners) public 
        MintableToken(_owners, 2)
    {
        require(3 == _owners.length);
    }

    function unpause() 
        public 
        onlymanyowners(keccak256(msg.data))
    {
        require(paused);
        paused = false;
        Unpause();
    }

    function transfer(address _to, uint256 _value) 
        public 
        whenNotPaused 
        payloadSizeIs(2 * 32)
        returns (bool) 
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) 
        public 
        whenNotPaused 
        payloadSizeIs(3 * 32)
        returns (bool) 
    {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public whenNotPaused returns (bool) {
        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue) public whenNotPaused returns (bool success) {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public whenNotPaused returns (bool success) {
        return super.decreaseApproval(_spender, _subtractedValue);
    }
    
    function getState() public returns (bool) {
        return paused;
    }
}