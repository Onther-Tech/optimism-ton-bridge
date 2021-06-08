// @unsupported: ovm

pragma solidity >=0.7.6;

import {
    Abs_L1TokenGateway
} from "@eth-optimism/contracts/build/contracts/OVM/bridge/tokens/Abs_L1TokenGateway.sol";

interface TokenLike {
    function transfer(address _to, uint256 _value)
        external
        returns (bool success);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success);
}

contract L1Gateway is Abs_L1TokenGateway {
    // --- Auth ---
    mapping(address => bool) public authorized;

    function rely(address usr) external auth {
        authorized[usr] = true;
        emit Rely(usr);
    }

    function deny(address usr) external auth {
        authorized[usr] = false;
        emit Deny(usr);
    }

    modifier auth {
        require(authorized[msg.sender], "L1Gateway/not-authorized");
        _;
    }

    event Rely(address indexed usr);
    event Deny(address indexed usr);

    TokenLike public immutable l1ERC20;
    address public immutable escrow;
    bool public isOpen = true;

    constructor(
        TokenLike _l1ERC20,
        address _l2Gateway,
        address _l1Messenger,
        address _escrow
    ) Abs_L1TokenGateway(_l2Gateway, _l1Messenger) {
        authorized[msg.sender] = true;
        emit Rely(msg.sender);

        l1ERC20 = _l1ERC20;
        escrow = _escrow;
    }

    function close() external auth {
        isOpen = false;
    }

    function _handleInitiateDeposit(
        address _from,
        address,
        uint256 _amount
    ) internal override {
        require(isOpen, "L1Gateway/closed");

        // NOTE: specific for TON token
        l1ERC20.transferFrom(_from, address(this), _amount);

        l1ERC20.transfer(escrow, _amount);
    }

    function _handleFinalizeWithdrawal(address _to, uint256 _amount)
        internal
        override
    {
        // NOTE: specific for TON token
        l1ERC20.transferFrom(escrow, address(this), _amount);

        l1ERC20.transfer(_to, _amount);
    }
}
