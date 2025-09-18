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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { encodeFunctionData } from "viem";
import { useMultiSigWalletInfo } from "@/hooks/useMultiSigWallet";
import { useQueryClient } from "@tanstack/react-query";

export const RemoveOwner = () => {
    const { walletAddress } = useParams();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState("");

    const queryClient = useQueryClient();

    const { numConfirmationsRequired, getTransactionsCountQueryKey } =
        useMultiSigWalletInfo();

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
            toast.success("Remove owner transaction submitted successfully!");
            handleDialogClose();
            queryClient.invalidateQueries({
                queryKey: getTransactionsCountQueryKey,
            });
        }
    }, [isConfirmed, error]);

    const handleOwnerSelection = (value: string) => {
        setSelectedOwner(value);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedOwner("");
    };

    const handleSubmit = () => {
        if (!selectedOwner) {
            toast.error("Please select an owner to remove");
            return;
        }

        // Encode the removeOwner function call
        const data = encodeFunctionData({
            abi: MultiSigWalletAbi,
            functionName: "removeOwner",
            args: [selectedOwner as `0x${string}`],
        });

        // Submit transaction to call removeOwner on the wallet itself
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "submitTransaction",
            args: [
                walletAddress as `0x${string}`, // to: wallet itself
                0n, // value: 0 ETH
                data, // data: encoded removeOwner call
            ],
        });
    };

    const isLoading = isPending || isConfirming;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    disabled={
                        (owners?.length ?? 3) <= (numConfirmationsRequired ?? 3)
                    }
                >
                    Remove Owner
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Remove Owner</DialogTitle>
                    <DialogDescription>
                        Remove an owner from the multisig wallet. This will
                        require confirmations from other owners.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6">
                    <Label>Select Owner to Remove</Label>
                    <RadioGroup
                        value={selectedOwner}
                        onValueChange={handleOwnerSelection}
                        className="space-y-2"
                    >
                        {owners?.map((owner: string) => (
                            <div
                                key={owner}
                                className="flex items-center space-x-2"
                            >
                                <RadioGroupItem value={owner} id={owner} />
                                <Label
                                    htmlFor={owner}
                                    className="text-sm font-mono cursor-pointer"
                                >
                                    {owner}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        disabled={isLoading || !selectedOwner}
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
