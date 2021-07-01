pragma solidity >=0.7.6;

import {L2StandardERC20} from "optimism-contracts/libraries/standards/L2StandardERC20.sol";

contract L2ERC20 is L2StandardERC20 {
    constructor(address _l2Bridge, address _l1Token)
        L2StandardERC20(_l2Bridge, _l1Token, "TEST L2 TOKEN", "TL2")
    {}
}
