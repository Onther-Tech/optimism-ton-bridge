pragma solidity >=0.7.6;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20NoOwnership is ERC20 {
    constructor() ERC20("name", "symbol") {}

    function mint(address account, uint256 amount) external {
        super._mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        super._burn(account, amount);
    }
}
