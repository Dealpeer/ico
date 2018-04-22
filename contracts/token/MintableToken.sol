pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../ownership/MultiownedControlled.sol";


contract MintableToken is StandardToken, MultiownedControlled {
    event Mint(address indexed to, uint256 amount);
    event MintFinished();

    bool public mintingFinished = false;

    function MintableToken(address[] _owners, uint _signaturesRequired) public 
        MultiownedControlled(_owners, _signaturesRequired)
    {}


    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    function mint(address _to, uint256 _amount) onlyController canMint public returns (bool) {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function finishMinting() onlyController canMint public returns (bool) {
        mintingFinished = true;
        emit MintFinished();
        return true;
    }
}
