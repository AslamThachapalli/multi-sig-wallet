import { useEffect, useState } from "react";
import { AddWallet } from "./AddWallet";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, TrashIcon } from "lucide-react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router";
import { CreateWallet } from "./CreateWallet";

export function WalletList() {
    const navigate = useNavigate();
    const { address } = useAccount();
    const [wallets, setWallets] = useState<
        { walletAddress: string; walletName: string }[]
    >([]);

    useEffect(() => {
        if (address) {
            const wallets = localStorage.getItem("wallets");
            if (wallets) {
                setWallets(JSON.parse(wallets)[address] ?? []);
            }
        }
    }, []);

    const handleAddWallet = (walletAddress: string, walletName: string) => {
        setWallets([...wallets, { walletAddress, walletName }]);
    };

    const handleRemoveWallet = (walletAddress: string) => {
        const updatedWallets = wallets.filter(
            (wallet) => wallet.walletAddress !== walletAddress
        );
        const updatedWalletsObj = {
            ...JSON.parse(localStorage.getItem("wallets") || "{}"),
            [address as string]: updatedWallets,
        };
        localStorage.setItem("wallets", JSON.stringify(updatedWalletsObj));
        setWallets(updatedWallets);
    };

    if (wallets.length === 0) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className=" flex flex-col gap-2 justify-start items-start">
                    <h2 className="text-2xl font-bold">
                        No wallets found. Add a wallet to get started.
                    </h2>
                    <div className="flex gap-2">
                        <AddWallet onAddWallet={handleAddWallet} />
                        <CreateWallet onWalletCreated={handleAddWallet} />
                    </div>
                </div>
            </div>
        );
    }

    const handleOpenWallet = (walletAddress: string) => {
        navigate(`/wallet/${walletAddress}`);
    };

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-4 justify-start items-start">
            <div className="flex gap-2">
                <AddWallet onAddWallet={handleAddWallet} />
                <CreateWallet onWalletCreated={handleAddWallet} />
            </div>
            <div className="w-full flex flex-col gap-2 justify-start items-start">
                <h1 className="text-2xl font-bold mb-4">Your Wallets</h1>
                {wallets.map((wallet) => (
                    <Card
                        key={wallet.walletAddress}
                        className="w-full cursor-pointer group"
                        onClick={() => handleOpenWallet(wallet.walletAddress)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{wallet.walletName}</CardTitle>
                                <Button
                                    variant="destructive"
                                    size={"icon"}
                                    className="size-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveWallet(
                                            wallet.walletAddress
                                        );
                                    }}
                                >
                                    <TrashIcon />
                                </Button>
                            </div>
                            <CardDescription>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        {wallet.walletAddress}
                                    </p>
                                    <div className=" text-muted-foreground hidden group-hover:flex items-center gap-2">
                                        <span className="text-sm ">Open</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
