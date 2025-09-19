// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./MultiSigWallet.sol";

contract MultiSigFactory {
    event WalletCreated(address indexed deployer, address wallet);

    function createWallet(
        address[] memory owners,
        uint256 numConfirmationsRequired
    ) external returns (address) {
        MultiSigWallet wallet = new MultiSigWallet(
            owners,
            numConfirmationsRequired
        );
        emit WalletCreated(msg.sender, address(wallet));
        return address(wallet);
    }
}
