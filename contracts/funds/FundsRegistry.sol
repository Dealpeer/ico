pragma solidity ^0.4.18;

import "../ownership/MultiownedControlled.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract FundsRegistry is MultiownedControlled {
    using SafeMath for uint256;
    
    mapping (address => uint256) public deposited;
    address public token;
    enum State { GATHERING, REFUNDING, SUCCEEDED }
    State public state = State.GATHERING;

    event Deposit(address indexed sender, uint value);
    event EtherSent(address indexed to, uint value);
    event StateChanged(State _state);
    event RefundSent(address indexed to, uint value);
    event TokenSent(address indexed to, uint value);

    modifier requiresState(State _state) {
        require(state == _state);
        _;
    }

    function FundsRegistry(address[] _owners, uint _signaturesRequired)
        public
        MultiownedControlled(_owners, _signaturesRequired)
    {
    }

    function() external payable {
        if (msg.value > 0)
            emit Deposit(msg.sender, msg.value);
    }

    function changeState(State _newState)
        external
        onlyController
    {
        assert(state != _newState);

        if (State.GATHERING == state) {   assert(State.REFUNDING == _newState || State.SUCCEEDED == _newState); }
        else assert(false);

        state = _newState;
        StateChanged(state);
    }

    function deposit(address investor) onlyController 
        public 
        requiresState(State.GATHERING)
        payable 
    {
        if (msg.value > 0) {
            deposited[investor] = deposited[investor].add(msg.value); 
            emit Deposit(msg.sender, msg.value);
        }
    }

    function withdrawPayments(address payee)
        external
        onlyController
        requiresState(State.REFUNDING)
    {
        uint256 payment = deposited[payee];

        require(payment != 0);
        require(this.balance >= payment);

        deposited[payee] = 0;

        payee.transfer(payment);
        emit RefundSent(payee, payment);
    }

    function sendEther(address to, uint value)
        public
        onlymanyowners(keccak256(msg.data))
    {
        require(0 != to);
        require(value > 0 && this.balance >= value);
        to.transfer(value);
        emit EtherSent(to, value);
    }

    function setToken(address _token)
        external
        onlyController
    {
        require(_token != address(0));
        token = _token;
    }

    function sendToken(address to, uint value)
        public
        onlymanyowners(keccak256(msg.data))
        returns (bool)
    {
        require(0 != to);
        require(value > 0);
        require(token != address(0));
        if (ERC20(token).transfer(to, value)) {
            emit TokenSent(to, value);
            return true;
        }
        return false;
    }
}