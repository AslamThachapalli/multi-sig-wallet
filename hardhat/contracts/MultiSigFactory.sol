// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./MultiSigWallet.sol";

contract MultiSigFactory {
    event WalletCreated(address wallet, address[] owners, uint256 required);

    function createWallet(
        address[] memory owners,
        uint256 numConfirmationsRequired
    ) external returns (address) {
        MultiSigWallet wallet = new MultiSigWallet(
            owners,
            numConfirmationsRequired
        );
        emit WalletCreated(address(wallet), owners, numConfirmationsRequired);
        return address(wallet);
    }
}
