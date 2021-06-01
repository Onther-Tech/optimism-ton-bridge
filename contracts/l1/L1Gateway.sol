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
    TokenLike public immutable l1ERC20;

    constructor(
        TokenLike _l1ERC20,
        address _l2ERC20,
        address _l1Messenger
    ) Abs_L1TokenGateway(_l2ERC20, _l1Messenger) {
        l1ERC20 = _l1ERC20;
    }

    function _handleInitiateDeposit(
        address _from,
        address _to,
        uint256 _amount
    ) internal override {
        l1ERC20.transferFrom(_from, address(this), _amount);
    }

    function _handleFinalizeWithdrawal(address _to, uint256 _amount)
        internal
        override
    {
        l1ERC20.transfer(_to, _amount);
    }
}
