import { network, artifacts } from "hardhat";
import { decodeEventLog } from "viem";

async function main() {
    // Connect to the network using viem
    const { viem } = await network.connect({
        network: "hardhatOp",
        chainType: "op",
    });

    const publicClient = await viem.getPublicClient();
    const [walletClient] = await viem.getWalletClients();

    console.log("Deployer address:", walletClient.account.address);

    // Load the artifact for MultiSigFactory
    const artifact = await artifacts.readArtifact("MultiSigFactory");

    // Deploy the contract
    console.log("Deploying MultiSigFactory...");
    const hash = await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        // constructorArgs: [] // add if your factory needs constructor args
    });

    // Wait for deployment confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const factoryAddress = receipt.contractAddress;

    console.log("✅ MultiSigFactory deployed at:", factoryAddress);

    // Interact with the factory (e.g., create a wallet)
    // Assuming your factory has: function createWallet(address[] owners, uint required)
    const owners = [walletClient.account.address]; // simple case: single owner
    const required = 1;

    console.log("Creating a MultiSigWallet through factory...");
    const tx = await walletClient.writeContract({
        abi: artifact.abi,
        address: factoryAddress!,
        functionName: "createWallet",
        args: [owners, BigInt(required)],
    });

    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("✅ MultiSigWallet created successfully!");

    const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx });

    // Parse logs for WalletCreated event
    const logs = receipt2.logs.map((log) =>
        decodeEventLog({
            abi: artifact.abi,
            data: log.data,
            topics: log.topics,
        })
    );

    for (const log of logs) {
        if (log.eventName === "WalletCreated") {
            console.log("🎉 New MultiSigWallet deployed at:", log.args.wallet);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
