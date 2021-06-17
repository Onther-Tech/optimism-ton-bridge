pragma solidity >=0.7.6;

contract L1GatewayRegistry {
    mapping(address => mapping(address => bool)) public registered;

    event GatewayRegistered(address indexed l1Gatway, address indexed l2Gatway);

    function register(address l1Gateway, address l2Gateway) external {
        require(l1Gateway != l2Gateway, "L1GatewayRegistry/identical-address");
        require(
            l1Gateway != address(0) && l2Gateway != address(0),
            "L1GatewayRegistry/zero-address"
        );
        require(
            !registered[l1Gateway][l2Gateway],
            "L1GatewayRegistry/already-registered"
        ); //@audit if it is allowed, event can be emitted repeatably

        registered[l1Gateway][l2Gateway] = true;

        emit GatewayRegistered(l1Gateway, l2Gateway);
    }
}
