// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MultiSigFactory} from "../contracts/MultiSigFactory.sol";
import {MultiSigWallet} from "../contracts/MultiSigWallet.sol";
import "forge-std/Test.sol";

contract MultiSigFactoryTest is Test {
    MultiSigFactory multiSigFactory;
    address owner1 = address(1);
    address owner2 = address(2);
    address owner3 = address(3);
    address owner4 = address(4);
    uint256 numConfirmationsRequired = 3;

    event WalletCreated(address wallet, address[] owners, uint256 required);

    function setUp() public {
        multiSigFactory = new MultiSigFactory();
    }

    // Basic Creation Tests
    function test_CreateWalletWithValidParameters() public {
        address[] memory owners = new address[](3);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;
        
        address walletAddress = multiSigFactory.createWallet(owners, numConfirmationsRequired);

        // Verify wallet was created
        assertTrue(walletAddress != address(0));
        
        // Verify wallet is a valid MultiSigWallet
        MultiSigWallet wallet = MultiSigWallet(payable(walletAddress));
        assertTrue(wallet.isOwner(owner1));
        assertTrue(wallet.isOwner(owner2));
        assertTrue(wallet.isOwner(owner3));
        assertEq(wallet.numConfirmationsRequired(), numConfirmationsRequired);
    }
}