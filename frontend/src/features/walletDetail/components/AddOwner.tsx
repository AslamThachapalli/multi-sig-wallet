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
import { Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { isAddress, encodeFunctionData } from "viem";
import { useMultiSigWalletInfo } from "@/hooks/useMultiSigWallet";
import { useQueryClient } from "@tanstack/react-query";

export const AddOwner = () => {
    const { walletAddress } = useParams();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [ownerAddress, setOwnerAddress] = useState("");
    const [addressError, setAddressError] = useState("");

    const queryClient = useQueryClient();

    const { getTransactionsCountQueryKey } = useMultiSigWalletInfo();

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const { data: owners } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getOwners",
    });

    useEffect(() => {
        if (error) {
            toast.error("Failed to submit transaction: " + error.message);
            return;
        }

        if (isConfirmed) {
            toast.success("Add owner transaction submitted successfully!");
            handleDialogClose();
            queryClient.invalidateQueries({ queryKey: getTransactionsCountQueryKey });
        }
    }, [isConfirmed, error]);

    const validateAddress = (address: string) => {
        if (!address) {
            return "Address is required";
        }

        // Basic Ethereum address validation
        if (!isAddress(address)) {
            return "Invalid Ethereum address format";
        }

        // Check if address is already an owner
        if (owners && owners.includes(address as `0x${string}`)) {
            return "Address is already an owner";
        }

        return "";
    };

    const handleAddressChange = (value: string) => {
        setOwnerAddress(value);
        setAddressError(validateAddress(value));
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setOwnerAddress("");
        setAddressError("");
    };

    const handleSubmit = () => {
        const addressError = validateAddress(ownerAddress);
        setAddressError(addressError);

        if (addressError) {
            return;
        }

        // Encode the addOwner function call
        const data = encodeFunctionData({
            abi: MultiSigWalletAbi,
            functionName: "addOwner",
            args: [ownerAddress as `0x${string}`],
        });

        // Submit transaction to call addOwner on the wallet itself
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "submitTransaction",
            args: [
                walletAddress as `0x${string}`, // to: wallet itself
                0n, // value: 0 ETH
                data, // data: encoded addOwner call
            ],
        });
    };

    const isLoading = isPending || isConfirming;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Owner
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Owner</DialogTitle>
                    <DialogDescription>
                        Add a new owner to the multisig wallet. This will
                        require confirmations from other owners.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <Label htmlFor="owner-address">Owner Address</Label>
                    <div className="flex flex-col gap-1">
                        <Input
                            id="owner-address"
                            name="owner-address"
                            placeholder="0x..."
                            value={ownerAddress}
                            onChange={(e) =>
                                handleAddressChange(e.target.value)
                            }
                            className={addressError ? "border-destructive" : ""}
                        />
                        {addressError && (
                            <p className="text-xs text-destructive">
                                {addressError}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        disabled={isLoading || !!addressError}
                        onClick={handleSubmit}
                    >
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        {isLoading ? "Submitting..." : "Submit Transaction"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
