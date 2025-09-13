import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { CheckCircle, ExternalLink } from "lucide-react";
import { formatEther } from "viem";
import { Badge } from "@/components/ui/badge";
import { useReadContract } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletedTransactionCardProps {
    txIndex: number;
    numConfirmationsRequired: bigint;
}

export function CompletedTransactionCard(
    props: Readonly<CompletedTransactionCardProps>
) {
    const { txIndex, numConfirmationsRequired } = props;
    const { walletAddress } = useParams();

    const {
        data: transaction,
        isPending: isTransactionPending,
        isRefetching: isTransactionRefetching,
        error: getTransactionError,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "transactions",
        args: [BigInt(txIndex)],
    });

    if (isTransactionPending) {
        return (
            <Card className="w-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (getTransactionError) {
        return (
            <Card className="w-xl">
                <CardContent className="pt-6">
                    <div className="text-destructive">
                        Error loading transaction {txIndex}:{" "}
                        {getTransactionError.shortMessage}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Only show if the transaction is executed
    if (!transaction[3]) {
        return null;
    }

    return (
        <Card className="w-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        Transaction #{txIndex}
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </CardTitle>
                    {isTransactionRefetching ? (
                        <Skeleton className="h-6 w-24" />
                    ) : (
                        <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                            Completed
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
                            <span className="font-medium">Confirmations:</span>
                            <span className="ml-2 font-mono">
                                {transaction[4]}/{numConfirmationsRequired}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <span className="font-medium">Status:</span>
                            <span className="ml-2 text-green-600 font-medium">
                                Successfully Executed
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                                View on Explorer
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
