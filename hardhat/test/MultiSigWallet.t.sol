// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MultiSigWallet} from "../contracts/MultiSigWallet.sol";
import {Test} from "forge-std/Test.sol";

contract MultiSigWalletTest is Test {
    MultiSigWallet msWallet;
    address owner1 = address(1);
    address owner2 = address(2);
    address owner3 = address(3);
    address owner4 = address(4);
    uint256 numConfirmationsRequired = 3;

    function setUp() public {
        address[] memory owners;
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;
        owners[3] = owner4;
        msWallet = new MultiSigWallet(owners, numConfirmationsRequired);
    }
}
