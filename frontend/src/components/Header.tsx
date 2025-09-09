import { WalletConnect } from "./WalletConnect";

export function Header() {
    return (
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl">MultiSig Wallet</h1>
            <WalletConnect />
        </header>
    );
}
