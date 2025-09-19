import { createConfig, http } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";

export const wagmiConfig = createConfig({
    chains: [hardhat, sepolia],
    transports: {
        [hardhat.id]: http(),
        [sepolia.id]: http(),
    },
});
