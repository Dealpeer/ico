pragma solidity ^0.4.18;

import "./funds/FundsRegistry.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract DevFund is FundsRegistry {
    using SafeMath for uint256;
    
    uint public closedTime = 0;
    uint256 public devFund = 0;
    uint256 public processed = 0;
    
    function DevFund (address[] _owners, uint _signaturesRequired) public 
        FundsRegistry(_owners, _signaturesRequired)
    {}

    function setTime(uint _closedTime) 
        public  
        onlyController   
    {   
        require(closedTime == 0);
        require(token != address(0));

        devFund = ERC20(token).balanceOf(address(this));
        closedTime = _closedTime;
    }  

    modifier checkRules {
        require(closedTime != 0);
        require(devFund != 0);
        require(closedTime + 271 days <= getCurrentTime());
        _;
    }

    function getCurrentTime() internal constant returns (uint) {
        return now;
    }

    function sendToken(address to, uint value) 
        public
        checkRules
        returns (bool)
    {
        // Can withdrawal all funds
        if (closedTime + 451 days <= getCurrentTime()) {
            return super.sendToken(to, value);
        } else if(closedTime + 271 days <= getCurrentTime()) {
            // Can withdrawal only 50% of funds
            require(devFund.div(2) >= processed.add(value));
            if (super.sendToken(to, value)) {
                processed = processed.add(value);
                return true;
            }
            return false;
        }
    }


}