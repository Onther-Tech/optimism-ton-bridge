pragma solidity >=0.7.6;
pragma abicoder v2;

import {
    OVM_L1CrossDomainMessenger
} from "@eth-optimism/contracts/build/contracts/OVM/bridge/messaging/OVM_L1CrossDomainMessenger.sol";

contract OVM_L1CrossDomainMessengerLocal is OVM_L1CrossDomainMessenger {}
