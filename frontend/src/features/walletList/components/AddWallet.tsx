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
import { isAddress } from "viem";

interface AddWalletProps {
    onAddWallet: (walletAddress: string, walletName: string) => void;
}

export function AddWallet({ onAddWallet }: AddWalletProps) {
    const { address } = useAccount();
    const walletsStr = localStorage.getItem("wallets");
    const wallets = walletsStr ? JSON.parse(walletsStr) : {};
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [walletName, setWalletName] = useState<string>("");
    const [errors, setErrors] = useState<{
        walletAddress?: string;
        walletName?: string;
    }>({});

    const { isLoading, refetch: checkIsOwner } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "isOwner",
        args: [address as `0x${string}`],
        query: {
            enabled: false, // Only run when manually triggered
        },
    });

    const validateWalletName = (name: string) => {
        if (!name.trim()) {
            return "Wallet name is required";
        }
        if (name.trim().length < 2) {
            return "Wallet name must be at least 2 characters";
        }
        return "";
    };

    const validateWalletAddress = (addr: string) => {
        if (!addr.trim()) {
            return "Wallet address is required";
        }
        if (!isAddress(addr)) {
            return "Invalid Ethereum address format";
        }
        return "";
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        // Validate wallet name
        const walletNameError = validateWalletName(walletName);
        if (walletNameError) {
            newErrors.walletName = walletNameError;
        }

        // Validate wallet address
        const walletAddressError = validateWalletAddress(walletAddress);
        if (walletAddressError) {
            newErrors.walletAddress = walletAddressError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleWalletNameChange = (value: string) => {
        setWalletName(value);
        // Clear error when user starts typing
        if (errors.walletName) {
            setErrors((prev) => ({ ...prev, walletName: undefined }));
        }
    };

    const handleWalletAddressChange = (value: string) => {
        setWalletAddress(value);
        // Clear error when user starts typing
        if (errors.walletAddress) {
            setErrors((prev) => ({ ...prev, walletAddress: undefined }));
        }
    };

    const handleDialogClose = () => {
        setWalletAddress("");
        setWalletName("");
        setErrors({});
    };

    const handleSubmit = async () => {
        if (!address) return;

        // Validate form before proceeding
        if (!validateForm()) {
            return;
        }

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
        handleDialogClose();
    };

    const isFormValid =
        !errors.walletName &&
        !errors.walletAddress &&
        walletName.trim() &&
        walletAddress.trim();

    return (
        <Dialog >
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
                    <div className="grid gap-2">
                        <Label htmlFor="walletAddress">Wallet Address</Label>
                        <Input
                            id="walletAddress"
                            name="walletAddress"
                            placeholder="0x..."
                            value={walletAddress}
                            onChange={(e) =>
                                handleWalletAddressChange(e.target.value)
                            }
                            className={
                                errors.walletAddress ? "border-destructive" : ""
                            }
                        />
                        {errors.walletAddress && (
                            <p className="text-xs text-destructive">
                                {errors.walletAddress}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="walletName">Wallet Name</Label>
                        <Input
                            id="walletName"
                            name="walletName"
                            placeholder="Wallet Name"
                            value={walletName}
                            onChange={(e) =>
                                handleWalletNameChange(e.target.value)
                            }
                            className={
                                errors.walletName ? "border-destructive" : ""
                            }
                        />
                        {errors.walletName && (
                            <p className="text-xs text-destructive">
                                {errors.walletName}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={handleDialogClose}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        disabled={isLoading || !isFormValid}
                        onClick={handleSubmit}
                    >
                        {isLoading && (
                            <Loader2Icon className="animate-spin mr-2" />
                        )}
                        Save Wallet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
