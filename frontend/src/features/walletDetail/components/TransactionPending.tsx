import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContracts,
} from "wagmi";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { formatEther } from "viem";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    to: string;
    value: bigint;
    data: string;
    executed: boolean;
    numConfirmations: bigint;
}

export function TransactionPending() {
    const { walletAddress } = useParams();
    const { address: userAddress } = useAccount();

    const [isConfirmed, setIsConfirmed] = useState<boolean[][]>([]);

    // Get required confirmations
    const {
        data: numConfirmationsRequired,
        isPending: isLoadingNumConfirmationsRequired,
        error: getNumConfirmationsRequiredError,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "numConfirmationsRequired",
    });

    // Get all transactions
    const {
        data: transactions,
        isPending: isLoadingTransactions,
        error: getTransactionsError,
        refetch: refetchTransactions,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getAllTransactions",
    });

    const gotTransactions = !isLoadingTransactions && !getTransactionsError;

    let isConfirmedReads: any[] = [];
    if (gotTransactions) {
        isConfirmedReads = (transactions as Transaction[]).map((_, index) => ({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "isConfirmed",
            args: [BigInt(index), userAddress as `0x${string}`],
        }));
    }

    // Get all transactions
    const {
        data: isConfirmedData,
        isPending: isLoadingIsConfirmed,
        error: getIsConfirmedError,
        refetch: refetchIsConfirmed,
    } = useReadContracts({
        contracts: isConfirmedReads,
        query: {
            enabled: gotTransactions,
        },
    });

    useEffect(() => {
        if (isConfirmedData?.length ?? false) {
            setIsConfirmed(isConfirmedData as unknown as boolean[][]);
        }
    }, [isConfirmedData]);

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
    }, [writeError, isConfirmingSuccess]);

    const handleConfirmTransaction = (txIndex: number) => {
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "confirmTransaction",
            args: [BigInt(txIndex)],
        });
    };

    const handleRevokeConfirmation = (txIndex: number) => {
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "revokeConfirmation",
            args: [BigInt(txIndex)],
        });
    };

    const handleExecuteTransaction = (txIndex: number) => {
        writeContract({
            address: walletAddress as `0x${string}`,
            abi: MultiSigWalletAbi,
            functionName: "executeTransaction",
            args: [BigInt(txIndex)],
        });
    };

    const isPending = isWritePending && isConfirming;

    return (
        <div className="space-y-4">
            {gotTransactions &&
                (transactions as Transaction[]).map((tx, index) => {
                    let canExecute: boolean;
                    if (!numConfirmationsRequired) {
                        canExecute = false;
                    } else {
                        canExecute =
                            tx.numConfirmations >=
                            (numConfirmationsRequired as number);
                    }

                    if (tx.executed) {
                        return null;
                    }

                    return (
                        <Card key={index}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        Transaction #{index}
                                    </CardTitle>
                                    <Badge
                                        variant={
                                            canExecute ? "default" : "secondary"
                                        }
                                    >
                                        {Number(tx.numConfirmations)}/
                                        {Number(numConfirmationsRequired || 0)}{" "}
                                        confirmations
                                    </Badge>
                                </div>
                                <CardDescription>
                                    To:{" "}
                                    <span className="font-mono text-sm">
                                        {tx.to}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">
                                                Amount:
                                            </span>
                                            <span className="ml-2 font-mono">
                                                {formatEther(tx.value)} ETH
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                Status:
                                            </span>
                                            <span className="ml-2">
                                                {canExecute
                                                    ? "Ready to execute"
                                                    : "Pending confirmations"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        {!isConfirmed[index] ? (
                                            <Button
                                                onClick={() =>
                                                    handleConfirmTransaction(
                                                        index
                                                    )
                                                }
                                                disabled={isPending}
                                                size="sm"
                                                variant="outline"
                                            >
                                                {isPending ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                )}
                                                Confirm
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    handleRevokeConfirmation(
                                                        index
                                                    )
                                                }
                                                disabled={isPending}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                {isPending ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                )}
                                                Revoke
                                            </Button>
                                        )}

                                        {canExecute && (
                                            <Button
                                                onClick={() =>
                                                    handleExecuteTransaction(
                                                        index
                                                    )
                                                }
                                                disabled={isPending}
                                                size="sm"
                                            >
                                                {isPending ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                )}
                                                Execute
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
        </div>
    );
}
