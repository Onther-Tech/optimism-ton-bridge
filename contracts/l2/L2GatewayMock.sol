pragma solidity >=0.7.6;

import {L2Gateway} from "./L2Gateway.sol";

contract L2GatewayMock is L2Gateway {
    constructor(
        address _l2CrossDomainMessenger,
        string memory _name,
        string memory _symbol
    ) L2Gateway(_l2CrossDomainMessenger, _name, _symbol) {
        token.mint(msg.sender, 3000);
    }
}
