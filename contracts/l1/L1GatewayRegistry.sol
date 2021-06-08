pragma solidity >=0.7.6;

contract L1GatewayRegistry {
    mapping(address => mapping(address => bool)) public registered;

    event GatewayRegistered(address indexed gateway0, address indexed gateway1);

    function register(address l1Gateway, address l2Gateway) external {
        require(l1Gateway != l2Gateway, "L1GatewayRegistry/identical-address");
        (address gateway0, address gateway1) =
            l1Gateway < l2Gateway
                ? (l1Gateway, l2Gateway)
                : (l2Gateway, l1Gateway);
        require(gateway0 != address(0), "L1GatewayRegistry/zero-address");
        require(
            !registered[gateway0][gateway1],
            "L1GatewayRegistry/already-registered"
        );

        registered[gateway0][gateway1] = true;

        emit GatewayRegistered(gateway0, gateway1);
    }
}
