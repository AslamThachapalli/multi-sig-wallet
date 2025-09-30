import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSigWallet", (m) => {
    const owner1 = m.getAccount(0);
    const owner2 = m.getAccount(1);
    const owner3 = m.getAccount(2);
    const owner4 = m.getAccount(3);

    const msWallet = m.contract("MultiSigWallet", [
        [owner1, owner2, owner3, owner4],
        3,
    ]);

    return { msWallet };
});
