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

// 3 buttons: confirm, revoke, execute
// on confirm/revoke => Get confirmation status - read isConfirmed - revalidate
// on confirm/revoke => Get 

interface PendingTransactionCardProps {
    txIndex: number;
    isExecutable: boolean;
    isConfirmed: boolean;
    numConfirmations: bigint;
    numConfirmationsRequired: bigint;
    to: string;
    value: bigint;
    data: string;
    getTransactionsQueryKey: readonly unknown[];
    isRefreshing: boolean;
}

export function PendingTransactionCard(
    props: Readonly<PendingTransactionCardProps>
) {
    const {
        txIndex,
        isExecutable,
        numConfirmations,
        numConfirmationsRequired,
        to,
        value,
        getTransactionsQueryKey,
        isRefreshing,
    } = props;

    const { walletAddress } = useParams();
    const { address: userAddress } = useAccount();
    const queryClient = useQueryClient();

    const [action, setAction] = useState<
        "confirm" | "revoke" | "execute" | undefined
    >(undefined);

    const {
        data: isConfirmed,
        isPending: isIsConfirmedPending,
        isRefetching: isIsConfirmedRefetching,
        error: getIsConfirmedError,
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
                queryKey: getTransactionsQueryKey,
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

    return (
        <Card key={txIndex}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Transaction #{txIndex}
                    </CardTitle>
                    <Badge variant={isExecutable ? "default" : "secondary"}>
                        {numConfirmations}/{numConfirmationsRequired}{" "}
                        confirmations
                    </Badge>
                </div>
                <CardDescription>
                    To: <span className="font-mono text-sm">{to}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Amount:</span>
                            <span className="ml-2 font-mono">
                                {formatEther(value)} ETH
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

                    {isRefreshing ? (
                        <div className="flex gap-2 flex-wrap">
                            <Skeleton className="h-8 w-24" />
                            {isExecutable && <Skeleton className="h-8 w-24" />}
                        </div>
                    ) : (
                        <div className="flex gap-2 flex-wrap">
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
