import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount, useReadContract } from "wagmi";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

interface AddWalletProps {
    onAddWallet: (walletAddress: string, walletName: string) => void;
}

export function AddWallet({ onAddWallet }: AddWalletProps) {
    const { address } = useAccount();
    const walletsStr = localStorage.getItem("wallets");
    const wallets = walletsStr ? JSON.parse(walletsStr) : {};
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [walletName, setWalletName] = useState<string>("");

    const { isLoading, refetch: checkIsOwner } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "isOwner",
        args: [address as `0x${string}`],
        query: {
            enabled: false, // Only run when manually triggered
        },
    });

    const handleSubmit = async () => {
        if (!address) return;

        const { data: ownerCheck } = await checkIsOwner();

        if (!ownerCheck) {
            toast.error(
                "This address is not an owner of the multi-sig wallet contract."
            );
            return;
        }

        const updatedWallets = {
            ...wallets,
            [address]: [
                ...(wallets[address] || []),
                {
                    walletAddress,
                    walletName,
                },
            ],
        };

        localStorage.setItem("wallets", JSON.stringify(updatedWallets));
        onAddWallet(walletAddress, walletName);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Add Wallet</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Wallet</DialogTitle>
                    <DialogDescription>
                        Add a new wallet to your wallet list. Click save when
                        you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="walletAddress">Wallet Address</Label>
                        <Input
                            id="walletAddress"
                            name="walletAddress"
                            placeholder="0x..."
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="walletName">Wallet Name</Label>
                        <Input
                            id="walletName"
                            name="walletName"
                            placeholder="Wallet Name"
                            value={walletName}
                            onChange={(e) => setWalletName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button disabled={isLoading} onClick={handleSubmit}>
                        {isLoading && <Loader2Icon className="animate-spin" />}
                        Save Wallet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
