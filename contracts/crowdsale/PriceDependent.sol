pragma solidity ^0.4.18;

import "../oraclize/usingOraclize.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract PriceDependent is usingOraclize {

    using SafeMath for uint256;

    // Five minutes, change to hour
    uint public constant PriceUpdateInterval = 60 * 60;
    uint public PriceInCents = 0;
    uint public lastUpdated = 0;

    event NewOraclizeQuery(string description);
    event NewETHPrice(uint price);

    modifier isExistPrice {
        require(PriceInCents > 0);
        _;
    }

    function PriceDependent(uint _price) public {
        PriceInCents = _price;
        oraclize_setProof(proofType_TLSNotary);
        // Need remove for main network
        //OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function updateEthPrice() public payable {
        if (oraclize_getPrice("URL") > this.balance) {
            NewOraclizeQuery("Oraclize request fail. Not enough ether");
        } else {
            NewOraclizeQuery("Oraclize query was sent");
            oraclize_query(
                PriceUpdateInterval,
                "URL",
                "json(https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD).0.price_usd"
            );
        }
    }


    function __callback(bytes32 myid, string result, bytes proof) public {
        require(msg.sender == oraclize_cbAddress());
        
        uint newPrice = parseInt(result).mul(100);
        if (newPrice > 0) {
            PriceInCents = newPrice;
            NewETHPrice(PriceInCents);
            updateEthPrice();
            lastUpdated = getCurrentTime();
        }
    }

    function getCurrentTime() internal constant returns (uint) {
        return now;
    }

    function ETHPriceInCents() internal view returns (uint) {
        return PriceInCents;
    }

}