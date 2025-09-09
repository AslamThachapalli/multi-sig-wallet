import { useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { WalletModal } from "@/components/WalletModal";
import { Button } from "@/components/ui/button";
import { WalletList } from "../components/WalletList";

export function WalletListPage() {
    const { isConnected } = useAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Header />
            {isConnected ? (
                <WalletList />
            ) : (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                    <h2 className="text-2xl font-semibold mb-4">
                        Welcome to MultiSig Wallet
                    </h2>
                    <p className="text-gray-500 mb-6 max-w-lg">
                        Connect your wallet to start using the MultiSig Wallet
                    </p>
                    <Button onClick={openModal}>Connect Wallet</Button>
                </div>
            )}
            <WalletModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
}
