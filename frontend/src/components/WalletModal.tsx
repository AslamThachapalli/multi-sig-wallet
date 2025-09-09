import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Wallet2Icon } from "lucide-react";
import { useAccount, useConnect } from "wagmi";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { connectors, connect } = useConnect();
    const { isConnected } = useAccount();

    if (!isOpen || isConnected) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Connect Wallet</DialogTitle>
                    <DialogDescription>
                        Connect with one of our available wallet providers or
                        create a new one
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-2">
                    {connectors.map((wallet) => (
                        <Button
                            key={wallet.id}
                            onClick={() => connect({ connector: wallet })}
                            className="p-8"
                        >
                            <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center">
                                {wallet.icon ? (
                                    <img
                                        src={wallet.icon}
                                        alt={`${wallet.name} logo`}
                                        className="w-8 h-8 object-contain"
                                    />
                                ) : (
                                    <Wallet2Icon className="w-8 h-8 object-contain" />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="font-medium">
                                    {wallet.name}
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
