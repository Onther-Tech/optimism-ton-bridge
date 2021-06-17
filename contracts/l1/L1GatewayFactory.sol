// @unsupported: ovm

pragma solidity >=0.7.6;

import { L1Escrow } from "./L1Escrow.sol";
import { L1Gateway, TokenLike } from "./L1Gateway.sol";
import { L1GatewayRegistry } from "./L1GatewayRegistry.sol";

contract L1GatewayFactory {
    address public owner;
    L1GatewayRegistry public registry;

    event Created(address indexed l1Gateway);

    constructor(L1GatewayRegistry _registry) {
        require(
            address(_registry) != address(0),
            "GatewayFactory/zero-address"
        );

        owner = msg.sender;
        registry = _registry;
    }

    function create(
        TokenLike l1ERC20,
        address l2Gateway,
        address l1Messenger,
        address escrow
    ) external {
        L1Gateway l1Gateway =
            new L1Gateway(l1ERC20, l2Gateway, l1Messenger, escrow);

        registry.register(address(l1Gateway), l2Gateway);

        L1Escrow(escrow).approve(
            address(l1ERC20),
            address(l1Gateway),
            uint256(-1)
        );

        emit Created(address(l1Gateway));
    }

    function close(L1Gateway l1Gateway) external {
        require(msg.sender == owner, "GatewayFactory/not-owner");

        l1Gateway.close();
    }
}
