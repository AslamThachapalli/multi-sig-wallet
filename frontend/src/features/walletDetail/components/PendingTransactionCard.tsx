import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { formatEther } from "viem";
import { Badge } from "@/components/ui/badge";
import {
    useAccount,
    useReadContract,
    useWaitForTransactionReceipt,
    useWriteContract,
} from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingTransactionCardProps {
    txIndex: number;
    numConfirmationsRequired: bigint;
    getTransactionsCountQueryKey: readonly unknown[];
}

export function PendingTransactionCard(
    props: Readonly<PendingTransactionCardProps>
) {
    const { txIndex, numConfirmationsRequired, getTransactionsCountQueryKey } =
        props;

    const { walletAddress } = useParams();
    const { address: userAddress } = useAccount();
    const queryClient = useQueryClient();

    const [action, setAction] = useState<
        "confirm" | "revoke" | "execute" | undefined
    >(undefined);

    const {
        data: transaction,
        isPending: isTransactionPending,
        isRefetching: isTransactionRefetching,
        error: getTransactionError,
        queryKey: getTransactionQueryKey,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "transactions",
        args: [BigInt(txIndex)],
    });

    const {
        data: isConfirmed,
        isLoading: isConfirmedLoading,
        error: getIsConfirmedError,
        queryKey: getIsConfirmedQueryKey,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "isConfirmed",
        args: [BigInt(txIndex), userAddress as `0x${string}`],
    });

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
            console.error("Error submitting transaction:", writeError);
            toast.error(`Transaction failed: ${writeError.message}`);
        }
    }, [writeError]);

    useEffect(() => {
        if (isConfirmingSuccess) {
            switch (action) {
                case "confirm":
                    toast.success("Transaction confirmed successfully!");
                    break;
                case "revoke":
                    toast.success("Transaction revoked successfully!");
                    break;
                case "execute":
                    toast.success("Transaction executed successfully!");
                    break;
            }
            setAction(undefined);

            queryClient.invalidateQueries({
                queryKey: getTransactionsCountQueryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getTransactionQueryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getIsConfirmedQueryKey,
            });
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

    if (isTransactionPending) {
        return <div>Transaction pending...</div>;
    }

    if (getTransactionError) {
        return (
            <div>
                Error loading transaction {txIndex}:{" "}
                {getTransactionError.shortMessage}
            </div>
        );
    }

    // If the transaction is executed, don't show it
    if (transaction[3]) {
        return null;
    }

    const isExecutable = transaction[4] >= numConfirmationsRequired;

    return (
        <Card key={txIndex} className="w-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Transaction #{txIndex}
                    </CardTitle>
                    {isTransactionRefetching ? (
                        <Skeleton className="h-8 w-32" />
                    ) : (
                        <Badge variant={isExecutable ? "default" : "secondary"}>
                            {transaction[4]}/{numConfirmationsRequired}{" "}
                            confirmations
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    To:{" "}
                    <span className="font-mono text-sm">{transaction[0]}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <span className="font-medium">Amount:</span>
                            <span className="ml-2 font-mono">
                                {formatEther(transaction[1])} ETH
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Status:</span>
                            <span className="ml-2">
                                {isExecutable
                                    ? "Ready to execute"
                                    : "Pending confirmations"}
                            </span>
                        </div>
                    </div>

                    {isConfirmedLoading || isTransactionRefetching ? (
                        <div className="flex gap-2 flex-wrap">
                            <Skeleton className="h-8 w-24" />
                            {isExecutable && <Skeleton className="h-8 w-24" />}
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2 flex-wrap">
                            {isConfirmed ? (
                                <Button
                                    onClick={() =>
                                        handleRevokeConfirmation(txIndex)
                                    }
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
                                    onClick={() =>
                                        handleConfirmTransaction(txIndex)
                                    }
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
                                    onClick={() =>
                                        handleExecuteTransaction(txIndex)
                                    }
                                    disabled={isPending}
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
                </div>
            </CardContent>
        </Card>
    );
}
