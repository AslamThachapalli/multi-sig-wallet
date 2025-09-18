// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MultiSigWallet} from "../contracts/MultiSigWallet.sol";
import "forge-std/Test.sol";

contract MultiSigWalletTest is Test {
    MultiSigWallet msWallet;
    address owner1 = address(1);
    address owner2 = address(2);
    address owner3 = address(3);
    address owner4 = address(4);
    uint256 numConfirmationsRequired = 3;

    address toAddress1 = address(123);

    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExcecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed removedOwner);

    function setUp() public {
        address[] memory owners = new address[](4);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;
        owners[3] = owner4;
        msWallet = new MultiSigWallet(owners, numConfirmationsRequired);
    }

    // Constructor Tests
    function test_FailWhen_InitializedWithInvalidOwner() public {
        address[] memory owners = new address[](2);
        owners[0] = address(0);
        owners[1] = owner1;

        vm.expectRevert(bytes("Invalid owner"));
        new MultiSigWallet(owners, 2);
    }

    function test_FailWhen_InitializedWithDuplicateOwners() public {
        address[] memory owners = new address[](2);
        owners[0] = owner1;
        owners[1] = owner1;

        vm.expectRevert(bytes("Owner not unique"));
        new MultiSigWallet(owners, 2);
    }

    function test_FailWhen_InitializedWithEmptyOwners() public {
        address[] memory owners = new address[](0);

        vm.expectRevert(bytes("Owners required"));
        new MultiSigWallet(owners, 2);
    }

    function test_FailWhen_RequiredConfirmationsIsZero() public {
        address[] memory owners = new address[](2);
        owners[0] = owner1;
        owners[1] = owner2;

        vm.expectRevert(bytes("invalid number of required confirmations."));
        new MultiSigWallet(owners, 0);
    }

    function test_FailWhen_OwnersLessThanRequiredConfirmations() public {
        address[] memory owners = new address[](2);
        owners[0] = owner1;
        owners[1] = owner2;

        vm.expectRevert(bytes("invalid number of required confirmations."));
        new MultiSigWallet(owners, 3);
    }

    function test_ReceiveEmitsDepositEvent() public {
        // 1. Give owner1 some ETH to send
        vm.deal(owner1, 5 ether);

        // 2. Expect the event
        vm.expectEmit(true, true, true, true);
        emit Deposit(owner1, 1 ether, 1 ether);
        // at this point, wallet balance will become 1 ether after deposit

        // 3. Prank as owner1 and send 1 ether to the contract
        vm.prank(owner1);
        (bool success, ) = address(msWallet).call{value: 1 ether}("");
        assertTrue(success);

        // 4. Check the wallet balance updated
        assertEq(address(msWallet).balance, 1 ether);
    }

    function test_SubmitTransaction() public {
        vm.startPrank(owner1);

        vm.expectEmit(true, true, true, true);
        emit SubmitTransaction(owner1, 0, toAddress1, 2, "");
        msWallet.submitTransaction(toAddress1, 2, "");

        vm.stopPrank();
    }

    function test_RevertWhen_SubmitTransactionByNotOwner() public {
        vm.prank(address(5));
        vm.expectRevert(bytes("not owner"));
        msWallet.submitTransaction(toAddress1, 2, "");
    }

    // Additional Deposit Tests
    function test_ReceiveMultipleDeposits() public {
        vm.deal(owner1, 10 ether);
        vm.deal(owner2, 5 ether);

        vm.prank(owner1);
        (bool success1, ) = address(msWallet).call{value: 2 ether}("");
        assertTrue(success1);
        assertEq(address(msWallet).balance, 2 ether);

        vm.prank(owner2);
        (bool success2, ) = address(msWallet).call{value: 1 ether}("");
        assertTrue(success2);
        assertEq(address(msWallet).balance, 3 ether);
    }

    function test_ReceiveZeroValue() public {
        vm.expectEmit(true, true, true, true);
        emit Deposit(owner1, 0, 0);
        
        vm.prank(owner1);
        (bool success, ) = address(msWallet).call{value: 0}("");
        assertTrue(success);
        assertEq(address(msWallet).balance, 0);
    }

    // Transaction Confirmation Tests
    function test_ConfirmTransaction() public {
        // Submit transaction
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        // Confirm transaction
        vm.prank(owner1);
        vm.expectEmit(true, true, false, false);
        emit ConfirmTransaction(owner1, 0);
        msWallet.confirmTransaction(0);
        
        // Check confirmation count
        (, , , , uint256 numConfirmations) = msWallet.transactions(0);
        assertEq(numConfirmations, 1);
    }

    function test_ConfirmTransactionByMultipleOwners() public {
        // Submit transaction
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        // Confirm by multiple owners
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        // Check confirmation count
        (, , , , uint256 numConfirmations) = msWallet.transactions(0);
        assertEq(numConfirmations, 3);
    }

    function test_RevertWhen_ConfirmTransactionByNotOwner() public {
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(address(5));
        vm.expectRevert(bytes("not owner"));
        msWallet.confirmTransaction(0);
    }

    function test_RevertWhen_ConfirmNonExistentTransaction() public {
        vm.prank(owner1);
        vm.expectRevert(bytes("tx does not exist"));
        msWallet.confirmTransaction(0);
    }

    function test_RevertWhen_ConfirmExecutedTransaction() public {
        vm.deal(address(msWallet), 1 ether);
        
        // Submit and execute transaction
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Try to confirm executed transaction
        vm.prank(owner4);
        vm.expectRevert(bytes("tx already executed"));
        msWallet.confirmTransaction(0);
    }

    function test_RevertWhen_ConfirmAlreadyConfirmedTransaction() public {
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        // Try to confirm again
        vm.prank(owner1);
        vm.expectRevert(bytes("tx already confirmed"));
        msWallet.confirmTransaction(0);
    }

    // Transaction Execution Tests
    function test_ExecuteTransaction() public {
        vm.deal(address(msWallet), 1 ether);
        
        // Submit transaction
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        // Confirm by required number of owners
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        // Execute transaction
        vm.prank(owner1);
        vm.expectEmit(true, true, false, false);
        emit ExcecuteTransaction(owner1, 0);
        msWallet.executeTransaction(0);
        
        // Check transaction is executed
        (, , , bool executed, ) = msWallet.transactions(0);
        assertTrue(executed);
        
        // Check balance transferred
        assertEq(address(toAddress1).balance, 1 ether);
        assertEq(address(msWallet).balance, 0);
    }

    function test_RevertWhen_ExecuteTransactionWithoutEnoughConfirmations() public {
        vm.deal(address(msWallet), 1 ether);
        
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        // Try to execute with only 1 confirmation (need 3)
        vm.prank(owner1);
        vm.expectRevert(bytes("cannot execute tx"));
        msWallet.executeTransaction(0);
    }

    function test_RevertWhen_ExecuteNonExistentTransaction() public {
        vm.prank(owner1);
        vm.expectRevert(bytes("tx does not exist"));
        msWallet.executeTransaction(0);
    }

    function test_RevertWhen_ExecuteAlreadyExecutedTransaction() public {
        vm.deal(address(msWallet), 1 ether);
        
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Try to execute again
        vm.prank(owner1);
        vm.expectRevert(bytes("tx already executed"));
        msWallet.executeTransaction(0);
    }

    function test_RevertWhen_ExecuteTransactionByNotOwner() public {
        vm.deal(address(msWallet), 1 ether);
        
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(address(5));
        vm.expectRevert(bytes("not owner"));
        msWallet.executeTransaction(0);
    }

    // Revoke Confirmation Tests
    function test_RevokeConfirmation() public {
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        // Revoke confirmation
        vm.prank(owner1);
        vm.expectEmit(true, true, false, false);
        emit RevokeConfirmation(owner1, 0);
        msWallet.revokeConfirmation(0);
        
        // Check confirmation count decreased
        (, , , , uint256 numConfirmations) = msWallet.transactions(0);
        assertEq(numConfirmations, 0);
    }

    function test_RevertWhen_RevokeConfirmationByNotOwner() public {
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(address(5));
        vm.expectRevert(bytes("not owner"));
        msWallet.revokeConfirmation(0);
    }

    function test_RevertWhen_RevokeNonExistentTransaction() public {
        vm.prank(owner1);
        vm.expectRevert(bytes("tx does not exist"));
        msWallet.revokeConfirmation(0);
    }

    function test_RevertWhen_RevokeNotConfirmedTransaction() public {
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        vm.expectRevert(bytes("tx not confirmed"));
        msWallet.revokeConfirmation(0);
    }

    function test_RevertWhen_RevokeExecutedTransaction() public {
        vm.deal(address(msWallet), 1 ether);
        
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Try to revoke executed transaction
        vm.prank(owner1);
        vm.expectRevert(bytes("tx already executed"));
        msWallet.revokeConfirmation(0);
    }

    // View Function Tests
    function test_GetTransactionCount() public {
        assertEq(msWallet.getTransactionCount(), 0);
        
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        assertEq(msWallet.getTransactionCount(), 1);
        
        vm.prank(owner2);
        msWallet.submitTransaction(toAddress1, 2 ether, "");
        assertEq(msWallet.getTransactionCount(), 2);
    }

    function test_GetTransaction() public {
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "0x1234");
        
        (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations) = 
            msWallet.transactions(0);
        
        assertEq(to, toAddress1);
        assertEq(value, 1 ether);
        assertEq(data, "0x1234");
        assertFalse(executed);
        assertEq(numConfirmations, 0);
    }

    function test_RevertWhen_GetNonExistentTransaction() public {
        vm.expectRevert();
        msWallet.transactions(0);
    }

    // Owner Management Tests
    function test_AddOwner() public {
        address newOwner = address(100);
        
        // Create a transaction to add owner
        bytes memory data = abi.encodeWithSignature("addOwner(address)", newOwner);
        
        vm.prank(owner1);
        msWallet.submitTransaction(address(msWallet), 0, data);
        
        // Confirm by required owners
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        // Execute transaction
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Check new owner is added
        assertTrue(msWallet.isOwner(newOwner));
        assertEq(msWallet.owners(4), newOwner);
    }

    function test_RevertWhen_AddOwnerByNotWallet() public {
        address newOwner = address(100);
        
        vm.prank(owner1);
        vm.expectRevert(bytes("tx must come from wallet"));
        msWallet.addOwner(newOwner);
    }

    function test_RemoveOwner() public {
        // Create a transaction to remove owner
        bytes memory data = abi.encodeWithSignature("removeOwner(address)", owner2);
        
        vm.prank(owner1);
        msWallet.submitTransaction(address(msWallet), 0, data);
        
        // Confirm by required owners
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner4);
        msWallet.confirmTransaction(0);
        
        // Execute transaction
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Check owner is removed
        assertFalse(msWallet.isOwner(owner2));
        assertEq(msWallet.owners(1), owner4); // owner2 should be replaced by owner4
    }

    function test_RevertWhen_RemoveOwnerByNotWallet() public {
        vm.prank(owner1);
        vm.expectRevert(bytes("tx must come from wallet"));
        msWallet.removeOwner(owner4);
    }

    // Edge Cases and Integration Tests
    function test_CompleteTransactionFlow() public {
        vm.deal(address(msWallet), 2 ether);
        
        // Submit transaction
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "0x1234");
        
        // Confirm by all owners
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        // Revoke one confirmation
        vm.prank(owner3);
        msWallet.revokeConfirmation(0);
        
        // Confirm again
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        // Execute transaction
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Verify execution
        (, , , bool executed, ) = msWallet.transactions(0);
        assertTrue(executed);
        assertEq(address(toAddress1).balance, 1 ether);
    }

    function test_MultipleTransactions() public {
        vm.deal(address(msWallet), 5 ether);
        
        // Submit multiple transactions
        vm.prank(owner1);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        vm.prank(owner2);
        msWallet.submitTransaction(toAddress1, 2 ether, "");
        
        vm.prank(owner3);
        msWallet.submitTransaction(toAddress1, 1 ether, "");
        
        assertEq(msWallet.getTransactionCount(), 3);
        
        // Execute first transaction
        vm.prank(owner1);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner2);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner3);
        msWallet.confirmTransaction(0);
        
        vm.prank(owner1);
        msWallet.executeTransaction(0);
        
        // Verify first transaction executed
        (, , , bool executed1, ) = msWallet.transactions(0);
        assertTrue(executed1);
        
        // Verify other transactions still pending
        (, , , bool executed2, ) = msWallet.transactions(1);
        assertFalse(executed2);
        
        (, , , bool executed3, ) = msWallet.transactions(2);
        assertFalse(executed3);
    }
}
