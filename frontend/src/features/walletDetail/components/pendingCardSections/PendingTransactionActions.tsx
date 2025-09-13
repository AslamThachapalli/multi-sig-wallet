import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingTransactionActionsProps {
    txIndex: number;
    isConfirmed: boolean;
    isConfirmedLoading: boolean;
    isTransactionRefetching: boolean;
    isExecutable: boolean;
    isEnoughBalance: boolean;
    onTransactionConfirmed?: () => void;
    onTransactionRevoked?: () => void;
    onTransactionExecuted?: () => void;
}

export const PendingTransactionActions = (
    props: Readonly<PendingTransactionActionsProps>
) => {
    const {
        txIndex,
        isConfirmed,
        isConfirmedLoading,
        isTransactionRefetching,
        isExecutable,
        isEnoughBalance,
        onTransactionConfirmed,
        onTransactionRevoked,
        onTransactionExecuted,
    } = props;
    const { walletAddress } = useParams();

    const [action, setAction] = useState<
        "confirm" | "revoke" | "execute" | undefined
    >(undefined);

    // Wagmi hooks for contract interactions
    const {
        writeContract,
        data: pendingTxHash,
        isPending: isWritePending,
        error: writeError,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmingSuccess } =
        useWaitForTransactionReceipt({
            hash: pendingTxHash as `0x${string}`,
        });

    useEffect(() => {
        if (writeError) {
            toast.error(`Transaction failed: ${writeError.message}`);
        }
    }, [writeError]);

    useEffect(() => {
        if (isConfirmingSuccess) {
            switch (action) {
                case "confirm":
                    onTransactionConfirmed?.();
                    toast.success("Transaction confirmed successfully!");
                    break;
                case "revoke":
                    onTransactionRevoked?.();
                    toast.success("Transaction revoked successfully!");
                    break;
                case "execute":
                    onTransactionExecuted?.();
                    toast.success("Transaction executed successfully!");
                    break;
            }
            setAction(undefined);
        }
    }, [isConfirmingSuccess]);

    const handleConfirmTransaction = (txIndex: number) => {
        setAction("confirm");
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "confirmTransaction",
            args: [BigInt(txIndex)],
        });
    };

    const handleRevokeConfirmation = (txIndex: number) => {
        setAction("revoke");
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "revokeConfirmation",
            args: [BigInt(txIndex)],
        });
    };

    const handleExecuteTransaction = (txIndex: number) => {
        setAction("execute");
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "executeTransaction",
            args: [BigInt(txIndex)],
        });
    };

    const isPending = isWritePending && isConfirming;

    return (
        <>
            {isConfirmedLoading || isTransactionRefetching ? (
                <div className="flex justify-end gap-2 flex-wrap">
                    <Skeleton className="h-8 w-24" />
                    {isExecutable && <Skeleton className="h-8 w-24" />}
                </div>
            ) : (
                <div className="flex justify-end gap-2 flex-wrap">
                    {isConfirmed ? (
                        <Button
                            onClick={() => handleRevokeConfirmation(txIndex)}
                            disabled={isPending}
                            variant="destructive"
                            size="sm"
                        >
                            {isPending && action === "revoke" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Revoke
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleConfirmTransaction(txIndex)}
                            disabled={isPending}
                            size="sm"
                            variant="outline"
                        >
                            {isPending && action === "confirm" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Confirm
                        </Button>
                    )}

                    {isExecutable && (
                        <Button
                            onClick={() => handleExecuteTransaction(txIndex)}
                            disabled={isPending || !isEnoughBalance}
                            size="sm"
                        >
                            {isPending && action === "execute" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ExternalLink className="mr-2 h-4 w-4" />
                            )}
                            Execute
                        </Button>
                    )}
                </div>
            )}
        </>
    );
};
