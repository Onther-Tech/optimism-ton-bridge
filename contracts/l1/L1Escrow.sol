pragma solidity >=0.7.6;

interface ApproveLike {
    function approve(address, uint256) external;
}

// Escrow funds on L1, manage approval rights

contract L1Escrow {
    // --- Auth ---
    mapping(address => bool) public authorized;

    function rely(address usr) external auth {
        authorized[usr] = true;
        emit Rely(usr);
    }

    function deny(address usr) external auth {
        authorized[usr] = false;
        emit Deny(usr);
    }

    modifier auth {
        require(authorized[msg.sender], "L1Escrow/not-authorized");
        _;
    }

    event Rely(address indexed usr);
    event Deny(address indexed usr);

    event Approve(
        address indexed token,
        address indexed spender,
        uint256 value
    );

    constructor() {
        authorized[msg.sender] = true;
        emit Rely(msg.sender);
    }

    function approve(
        address token,
        address spender,
        uint256 value
    ) external auth {
        emit Approve(token, spender, value);

        ApproveLike(token).approve(spender, value);
    }
}
