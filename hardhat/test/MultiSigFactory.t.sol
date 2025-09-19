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

    function setUp() public {
        multiSigFactory = new MultiSigFactory();
    }

    // Basic Creation Tests
    function test_CreateWalletWithValidParameters() public {
        address[] memory owners = new address[](3);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;

        address walletAddress = multiSigFactory.createWallet(
            owners,
            numConfirmationsRequired
        );

        // Verify wallet was created
        assertTrue(walletAddress != address(0));

        // Verify wallet is a valid MultiSigWallet
        MultiSigWallet wallet = MultiSigWallet(payable(walletAddress));
        assertTrue(wallet.isOwner(owner1));
        assertTrue(wallet.isOwner(owner2));
        assertTrue(wallet.isOwner(owner3));
        assertEq(wallet.numConfirmationsRequired(), numConfirmationsRequired);
    }

    function test_CreateMultipleWallets() public {
        address[] memory owners1 = new address[](3);
        owners1[0] = owner1;
        owners1[1] = owner2;
        owners1[2] = owner3;

        address[] memory owners2 = new address[](2);
        owners2[0] = owner2;
        owners2[1] = owner4;

        address wallet1 = multiSigFactory.createWallet(owners1, 2);
        address wallet2 = multiSigFactory.createWallet(owners2, 2);

        // Verify both wallets are different
        assertTrue(wallet1 != wallet2);
        assertTrue(wallet1 != address(0));
        assertTrue(wallet2 != address(0));

        // Verify both wallets work independently
        MultiSigWallet w1 = MultiSigWallet(payable(wallet1));
        MultiSigWallet w2 = MultiSigWallet(payable(wallet2));

        assertTrue(w1.isOwner(owner1));
        assertTrue(w1.isOwner(owner2));
        assertTrue(w1.isOwner(owner3));
        assertFalse(w1.isOwner(owner4));

        assertFalse(w2.isOwner(owner1));
        assertTrue(w2.isOwner(owner2));
        assertFalse(w2.isOwner(owner3));
        assertTrue(w2.isOwner(owner4));
    }
}
