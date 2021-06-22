pragma solidity >=0.7.6;

import {
    Abs_L2DepositedToken
} from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";
import {L2Token} from "./L2Token.sol";

contract L2Gateway is Abs_L2DepositedToken {
    L2Token public token;

    constructor(
        address _l2CrossDomainMessenger,
        string memory _name,
        string memory _symbol
    ) Abs_L2DepositedToken(_l2CrossDomainMessenger) {
        token = new L2Token(_name, _symbol);
    }

    function _handleInitiateWithdrawal(address _to, uint256 _amount)
        internal
        override
    {
        token.burn(msg.sender, _amount);
    }

    // When a deposit is finalized, we credit the account on L2 with the same amount of tokens.
    function _handleFinalizeDeposit(address _to, uint256 _amount)
        internal
        override
    {
        token.mint(_to, _amount);
    }
}
