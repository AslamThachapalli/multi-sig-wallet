import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSigFactory", (m) => {
    const msFactory = m.contract("MultiSigFactory");

    return { msFactory };
});
