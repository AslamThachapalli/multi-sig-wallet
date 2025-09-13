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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

interface DepositEtherProps {
    balanceQueryKey: readonly unknown[];
}

export const DepositEther = (props: Readonly<DepositEtherProps>) => {
    const { balanceQueryKey } = props;
    const { walletAddress } = useParams();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [amountError, setAmountError] = useState("");

    const {
        data: hash,
        isPending,
        sendTransaction,
        error,
    } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (error) {
            toast.error(
                "Failed to submit transaction with error: " + error.message
            );
            return;
        }

        if (isConfirmed) {
            queryClient.invalidateQueries({ queryKey: balanceQueryKey });
            toast.success("Ether deposited successfully!");
            handleDialogClose();
        }
    }, [isConfirmed, error]);

    const validateAmount = (amount: string) => {
        if (!amount) {
            return "Amount is required";
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0.0001) {
            return "Atleast 0.0001 ETH is required";
        }
        return "";
    };

    const handleAmountChange = (value: string) => {
        setAmount(value);
        setAmountError(validateAmount(value));
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        // Reset form when dialog closes
        setAmount("");
        setAmountError("");
    };

    const handleSubmit = () => {
        // Validate Amount
        const amountError = validateAmount(amount);
        setAmountError(amountError);

        if (amountError) {
            return;
        }

        sendTransaction({
            to: walletAddress as `0x${string}`,
            value: parseEther(amount),
        });
    };

    const isLoading = isPending || isConfirming;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>Deposit Ether</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Deposit Ether</DialogTitle>
                    <DialogDescription>
                        Deposit Ether to the wallet.
                    </DialogDescription>
                </DialogHeader>
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
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className={amountError ? "border-destructive" : ""}
                        />
                        {amountError && (
                            <p className="text-xs text-destructive">
                                {amountError}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button disabled={isLoading} onClick={handleSubmit}>
                        {isLoading && <Loader2 className="animate-spin" />}
                        {isLoading ? "Sending..." : "Send"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
