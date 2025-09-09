import { WalletIcon } from "lucide-react";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { WalletModal } from "./WalletModal";
import { Button } from "./ui/button";

export const WalletConnect = () => {
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleDisconnect = () => {
        disconnect();
    };

    if (isConnected) {
        return (
            <div className="flex items-center">
                <div className="bg-secondary border border-accent-foreground/10 rounded-lg py-2 px-4 flex items-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                </div>
                <Button onClick={handleDisconnect} variant={"outline"}>Disconnect</Button>
            </div>
        );
    }

    return (
        <>
            <Button onClick={openModal}>
                <WalletIcon className="w-4 h-4 mr-2" />
                Connect Wallet
            </Button>
            <WalletModal isOpen={isModalOpen} onClose={closeModal} />
        </>
    );
};
