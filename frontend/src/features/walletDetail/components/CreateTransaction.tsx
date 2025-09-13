import { Loader2, PlusIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { isAddress } from "viem";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { useMultiSigWalletInfo } from "@/hooks/useMultiSigWallet";
import { useQueryClient } from "@tanstack/react-query";

export function CreateTransaction() {
    const { walletAddress } = useParams();

    // Form state
    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Validation state
    const [toAddressError, setToAddressError] = useState("");
    const [amountError, setAmountError] = useState("");

    // Wagmi hooks
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    const { getTransactionsCountQueryKey } = useMultiSigWalletInfo();

    const queryClient = useQueryClient();

    useEffect(() => {
        if (error) {
            toast.error("Failed to submit transaction with error: " + error.message);
            return;
        }

        if (isSuccess) {
            queryClient.invalidateQueries({ queryKey: getTransactionsCountQueryKey });
            toast.success("Transaction submitted successfully!");
            handleDialogClose();
        }
    }, [isSuccess, error]);

    // Validation functions
    const validateToAddress = (address: string) => {
        if (!address) {
            return "Address is required";
        }
        if (!isAddress(address)) {
            return "Invalid Ethereum address";
        }
        return "";
    };

    const validateAmount = (amount: string) => {
        if (!amount) {
            return "Amount is required";
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return "Amount must be greater than 0";
        }
        return "";
    };

    const handleToAddressChange = (value: string) => {
        setToAddress(value);
        setToAddressError(validateToAddress(value));
    };

    const handleAmountChange = (value: string) => {
        setAmount(value);
        setAmountError(validateAmount(value));
    };

    const handleSubmit = () => {
        // Validate all fields
        const toError = validateToAddress(toAddress);
        const amountError = validateAmount(amount);

        setToAddressError(toError);
        setAmountError(amountError);

        if (toError || amountError) {
            return;
        }

        // Convert amount to Wei (assuming input is in ETH)
        const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "submitTransaction",
            args: [toAddress as `0x${string}`, amountInWei, "0x"],
        });
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        // Reset form when dialog closes
        setToAddress("");
        setAmount("");
        setToAddressError("");
        setAmountError("");
    };

    const isLoading = isPending || isConfirming;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusIcon /> Create
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Transaction</DialogTitle>
                    <DialogDescription>
                        Create a new transaction to the wallet.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="to">To</Label>
                        <div className="flex flex-col gap-1">
                            <Input
                                id="to"
                                name="to-address"
                                placeholder="0x..."
                                value={toAddress}
                                onChange={(e) =>
                                    handleToAddressChange(e.target.value)
                                }
                                className={
                                    toAddressError ? "border-destructive" : ""
                                }
                            />
                            {toAddressError && (
                                <p className="text-xs text-destructive">
                                    {toAddressError}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="amount">Amount (ETH)</Label>
                        <div className="flex flex-col gap-1">
                            <Input
                                id="amount"
                                name="amount"
                                placeholder="Enter ETH to send"
                                type="number"
                                step="0.000001"
                                value={amount}
                                onChange={(e) =>
                                    handleAmountChange(e.target.value)
                                }
                                className={
                                    amountError ? "border-destructive" : ""
                                }
                            />
                            {amountError && (
                                <p className="text-xs text-destructive">
                                    {amountError}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={handleDialogClose}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isLoading || !!toAddressError || !!amountError
                        }
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isPending ? "Submitting..." : "Confirming..."}
                            </>
                        ) : (
                            "Create"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
