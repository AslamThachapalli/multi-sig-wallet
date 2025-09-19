export const MultiSigFactoryAbi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "deployer",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "wallet",
                type: "address",
            },
        ],
        name: "WalletCreated",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "owners",
                type: "address[]",
            },
            {
                internalType: "uint256",
                name: "numConfirmationsRequired",
                type: "uint256",
            },
        ],
        name: "createWallet",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;
