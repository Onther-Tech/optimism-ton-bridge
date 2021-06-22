pragma solidity >=0.7.6;
pragma abicoder v2;

import {
    OVM_L1CrossDomainMessenger
} from "@eth-optimism/contracts/OVM/bridge/messaging/OVM_L1CrossDomainMessenger.sol";

import {
    OVM_L2CrossDomainMessenger
} from "@eth-optimism/contracts/OVM/bridge/messaging/OVM_L2CrossDomainMessenger.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC165} from "@openzeppelin/contracts/introspection/ERC165.sol";
import {
    ERC165Checker
} from "@openzeppelin/contracts/introspection/ERC165Checker.sol";

abstract contract OnApprove is ERC165 {
    function onApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data
    ) external virtual returns (bool);
}

contract L1TON is ERC20 {
    constructor() ERC20("Tokamak Network Token", "TON") {}

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        // NOTE: TON inherits the SeigToken contract.
        // https://github.com/Onther-Tech/plasma-evm-contracts/blob/audit/cretik-04-2020/contracts/stake/tokens/SeigToken.sol#L30
        require(
            msg.sender == sender || msg.sender == recipient,
            "TON/invalid-sender"
        );

        return super.transferFrom(sender, recipient, amount);
    }

    /**
     * Mint tokens for specific account.
     * NOTE: for test
     * @param account Address receiving the minted.
     * @param amount Amount being minted.
     */
    function mint(address account, uint256 amount) external {
        super._mint(account, amount);
    }

    function approveAndCall(
        address spender,
        uint256 amount,
        bytes memory data
    ) public returns (bool) {
        require(approve(spender, amount));
        _callOnApprove(msg.sender, spender, amount, data);
        return true;
    }

    function _callOnApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes memory data
    ) internal {
        bytes4 onApproveSelector = OnApprove(spender).onApprove.selector;

        require(
            ERC165Checker.supportsInterface(spender, onApproveSelector),
            "ERC20OnApprove: spender doesn't support onApprove"
        );

        (bool ok, bytes memory res) =
            spender.call(
                abi.encodeWithSelector(
                    onApproveSelector,
                    owner,
                    spender,
                    amount,
                    data
                )
            );

        // check if low-level call reverted or not
        require(ok, string(res));

        assembly {
            ok := mload(add(res, 0x20))
        }

        // check if OnApprove.onApprove returns true or false
        require(ok, "ERC20OnApprove: failed to call onApprove");
    }
}
