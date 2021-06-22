// @unsupported: ovm

pragma solidity >=0.7.6;

import {L1Gateway} from "./L1Gateway.sol";
import {L1GatewayRegistry} from "./L1GatewayRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC165} from "@openzeppelin/contracts/introspection/ERC165.sol";

contract L1GatewayOnApprove is ERC165 {
    IERC20 public token;
    L1GatewayRegistry public registry;

    bytes4 constant DEPOSIT_SIG = bytes4(keccak256("deposit(uint256)"));

    constructor(IERC20 _token, L1GatewayRegistry _registry) {
        _registerInterface(L1GatewayOnApprove(this).onApprove.selector);

        // @audit to check EOA or CA
        token = _token;
        registry = _registry;
    }

    function onApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data
    ) external returns (bool) {
        require(
            msg.sender == address(token),
            "L1GatewayOnApprove/invalid-sender"
        );

        (address l1Gateway, address l2Gateway) = _decodeOnApproveData(data);
        require(
            registry.registered(l1Gateway, l2Gateway),
            "L1GatewayOnApprove/not-registered"
        );

        (bool success, ) =
            l1Gateway.call(abi.encodeWithSelector(DEPOSIT_SIG, amount));
        // @audit needs require(success)?
        return success;
    }

    function _decodeOnApproveData(bytes memory data)
        internal
        pure
        returns (address l1Gateway, address l2Gateway)
    {
        assembly {
            l1Gateway := mload(add(data, 0x20))
            l2Gateway := mload(add(add(data, 0x20), 0x20)) // @audit why do I have to add 0x20?
        }
    }
}
