pragma solidity >=0.7.6;
pragma abicoder v2;

import {
    OVM_L1CrossDomainMessenger
} from "@eth-optimism/contracts/build/contracts/OVM/bridge/messaging/OVM_L1CrossDomainMessenger.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OVM_L1CrossDomainMessengerLocal is OVM_L1CrossDomainMessenger {}

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
}

contract L2TON is ERC20 {
    constructor() ERC20("Tokamak Network Token", "TON") {}
}
