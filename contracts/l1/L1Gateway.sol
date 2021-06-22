// @unsupported: ovm

pragma solidity >=0.7.6;

import {
    Abs_L1TokenGateway
} from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L1TokenGateway.sol";
import {ERC165} from "@openzeppelin/contracts/introspection/ERC165.sol";

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

contract L1Gateway is Abs_L1TokenGateway, ERC165 {
    TokenLike public immutable l1ERC20;
    address public immutable escrow;

    constructor(
        TokenLike _l1ERC20,
        address _l2Gateway,
        address _l1Messenger,
        address _escrow
    ) Abs_L1TokenGateway(_l2Gateway, _l1Messenger) {
        _registerInterface(L1Gateway(this).onApprove.selector);

        l1ERC20 = _l1ERC20;
        escrow = _escrow;
    }

    function onApprove(
        address owner,
        address,
        uint256 amount,
        bytes calldata
    ) external returns (bool) {
        require(msg.sender == address(l1ERC20), "L1Gateway/invalid-sender");

        _initiateDeposit(owner, owner, amount);

        return true;
    }

    function _handleInitiateDeposit(
        address _from,
        address,
        uint256 _amount
    ) internal override {
        l1ERC20.transferFrom(_from, address(this), _amount); // NOTE: specific for TON token
        l1ERC20.transfer(escrow, _amount);
    }

    function _handleFinalizeWithdrawal(address _to, uint256 _amount)
        internal
        override
    {
        l1ERC20.transferFrom(escrow, address(this), _amount); // NOTE: specific for TON token
        l1ERC20.transfer(_to, _amount);
    }
}
