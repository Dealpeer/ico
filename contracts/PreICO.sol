pragma solidity ^0.4.21;

import "./crowdsale/CrowdsaleBase.sol";
import "./crowdsale/PriceDependent.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./ownership/multiowned.sol";

contract PreICO is CrowdsaleBase, PriceDependent, multiowned {

    using SafeMath for uint256;
    
    uint public openingTime = 0;
    uint public closingTime = 0;

    uint public raisedAmount = 0;
    uint public hc = 0; 

    event SetTime(uint time, bool isStart);

    modifier checkDatesAndLimits() {
        require(PriceInCents > 0);
        require(now >= openingTime && now <= closingTime);
        require(hc > raisedAmount);
        _;
    }

    function PreICO(address[] _owners, uint _signaturesRequired, address _wallet, address _token, uint _price, uint _cap) 
    public 
        CrowdsaleBase(_wallet, _token) 
        multiowned(_owners, _signaturesRequired)
        PriceDependent(_price)
    {
        hc = _cap;
    }  

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) 
        checkDatesAndLimits
    internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
        uint256 purchaseAmount = _weiAmount.mul(ETHPriceInCents()).div(100000000000000000000);
        raisedAmount = raisedAmount.add(purchaseAmount);
    }

    function getStartTime() public returns (uint) {
        return openingTime;
    }

    function tokenPriceInCents() internal view returns (uint) {
        if (getCurrentTime() < getStartTime() + 15 days) return 55;
        if (getCurrentTime() < getStartTime() + 30 days) return 60;
        return 65;
    }

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount.mul(ETHPriceInCents()).div(tokenPriceInCents());
    }

    // Can only set once
    function setStartTime(uint _time) public onlymanyowners(keccak256(msg.data)) {
        require(_time >= getCurrentTime());
        require(openingTime == 0);

        if (closingTime != 0)
            require(_time < closingTime);

        openingTime = _time;

        SetTime(_time, true);
    }

    function setStopTime(uint _time) public onlymanyowners(keccak256(msg.data)) {
        require(_time >= getCurrentTime());

        if (openingTime != 0)
            require(_time > openingTime);

        closingTime = _time;

        SetTime(_time, false);
    }

}