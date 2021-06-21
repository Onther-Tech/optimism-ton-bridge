pragma solidity >=0.7.6;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract L2Token is ERC20 {
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "L2Token/no-ownership");
        _;
    }

    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {
        owner = msg.sender;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        super._mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        super._burn(account, amount);
    }
}
