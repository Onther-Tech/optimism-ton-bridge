pragma solidity >=0.7.6;

import {
    Abs_L2DepositedToken
} from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";

interface Mintable {
    function mint(address account, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}

contract L2Gateway is Abs_L2DepositedToken {
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
        require(authorized[msg.sender], "L2Gateway/not-authorized");
        _;
    }

    event Rely(address indexed usr);
    event Deny(address indexed usr);

    Mintable public immutable token;
    bool public isOpen = true;

    constructor(address _l2CrossDomainMessenger, address _token)
        Abs_L2DepositedToken(_l2CrossDomainMessenger)
    {
        authorized[msg.sender] = true;
        emit Rely(msg.sender);

        token = Mintable(_token);
    }

    function close() external auth {
        isOpen = false;
    }

    function _handleInitiateWithdrawal(address _to, uint256 _amount)
        internal
        override
    {
        // do not allow initiaitng new xchain messages if bridge is closed
        require(isOpen, "L2Gateway/closed");
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
