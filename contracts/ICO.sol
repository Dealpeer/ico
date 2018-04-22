pragma solidity ^0.4.21;

import "./crowdsale/CrowdsaleBase.sol";
import "./crowdsale/PriceDependent.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./ownership/multiowned.sol";
import "./funds/FundsRegistry.sol";
import "./DevFund.sol";
import "./TeamFund.sol";

// withdrawal and SC
// Finish ICO (funds)
contract ICO is CrowdsaleBase, PriceDependent, multiowned {

    using SafeMath for uint256;
    
    uint public openingTime = 0;
    uint public closingTime = 0;

    uint public raisedAmount = 0;
    uint public hc = 0; 
    uint public goal = 0;

    address public devFund;
    address public teamFund;

    bool closedCrowdsale = false;
    bool mintingFinished = false;

    event SetTime(uint time, bool isStart);

    modifier checkDatesAndLimits() {
        require(devFund != address(0));
        require(teamFund != address(0));
        require(PriceInCents > 0);
        require(now >= openingTime && now <= closingTime);
        require(hc > raisedAmount);
        _;
    }

    modifier afterCrowdsale {
        require(now >= closingTime);
        _;
    }

    function ICO(address[] _owners, uint _signaturesRequired, address _wallet, address _token, uint _price, uint _goal, uint _cap) 
    public 
        CrowdsaleBase(_wallet, _token) 
        multiowned(_owners, _signaturesRequired)
        PriceDependent(_price)
    {
        hc = _cap;
        goal = _goal;
    }  

    function setFunds(address _devFund, address _teamFund) 
        onlymanyowners(keccak256(msg.data))
        public 
    {
        require(_devFund != address(0));
        require(_teamFund != address(0));
        devFund = _devFund;
        teamFund = _teamFund;
    } 

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) 
        checkDatesAndLimits
    internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount.mul(ETHPriceInCents()).div(tokenPriceInCents());
    }

    function finishCrowdsale() 
        public 
        afterCrowdsale
    {
        require(!closedCrowdsale);
        closedCrowdsale = true;

        if (goal > raisedAmount) {
            FundsRegistry(wallet).changeState(FundsRegistry.State.REFUNDING);
        } else {
            FundsRegistry(wallet).changeState(FundsRegistry.State.SUCCEEDED);
        }

        DevFund(devFund).setTime(closingTime);
        TeamFund(teamFund).setTime(closingTime);
    }

    function withdrawPayments() 
        public 
        afterCrowdsale
    { 
        require(goal > raisedAmount);
        FundsRegistry(wallet).withdrawPayments(msg.sender);
    }

    function finishMinting() 
        public 
        onlymanyowners(keccak256(msg.data))
    {
        require(now >= closingTime);
        require(goal <= raisedAmount);
        require(!mintingFinished);

        mintingFinished = true;

        uint256 total_supply = token.totalSupply();
        token.mint(wallet, total_supply.div(70).mul(5));
        token.mint(teamFund, total_supply.div(70).mul(15));
        token.mint(devFund, total_supply.div(70).mul(10));

        token.finishMinting();
        
    }

    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
        uint256 purchaseAmount = _weiAmount.mul(ETHPriceInCents()).div(100000000000000000000);
        raisedAmount = raisedAmount.add(purchaseAmount);
    }

    function getStartTime() public returns (uint) {
        return openingTime;
    }

    function tokenPriceInCents() internal view returns (uint) {
        if (getCurrentTime() < getStartTime() + 6 days) return 86;
        if (getCurrentTime() < getStartTime() + 12 days) return 87;
        if (getCurrentTime() < getStartTime() + 18 days) return 88;
        if (getCurrentTime() < getStartTime() + 24 days) return 89;
        if (getCurrentTime() < getStartTime() + 30 days) return 90;
        if (getCurrentTime() < getStartTime() + 36 days) return 91;
        if (getCurrentTime() < getStartTime() + 42 days) return 92;
        if (getCurrentTime() < getStartTime() + 48 days) return 93;
        if (getCurrentTime() < getStartTime() + 54 days) return 94;
        if (getCurrentTime() < getStartTime() + 60 days) return 95;
        if (getCurrentTime() < getStartTime() + 66 days) return 96;
        if (getCurrentTime() < getStartTime() + 72 days) return 97;
        if (getCurrentTime() < getStartTime() + 78 days) return 98;
        if (getCurrentTime() < getStartTime() + 84 days) return 99;
        return 100;
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