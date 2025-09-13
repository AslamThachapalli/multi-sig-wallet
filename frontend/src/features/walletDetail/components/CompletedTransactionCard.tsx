import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadContract } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { decodeFunctionData } from "viem";
import { CompletedTransferContent } from "./completedCardSections/CompletedTransferContent";
import { CompletedManageMemberContent } from "./completedCardSections/CompletedManageMemberContent";

interface CompletedTransactionCardProps {
    txIndex: number;
    numConfirmationsRequired: bigint;
}

type TransactionType = "addOwner" | "removeOwner" | "transfer";

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

    // Determine transaction type by decoding the data
    let transactionType: TransactionType = "transfer";
    try {
        if (transaction[2] && transaction[2].length > 0) {
            const decoded = decodeFunctionData({
                abi: MultiSigWalletAbi,
                data: transaction[2],
            });
            transactionType = decoded.functionName as TransactionType;
        }
    } catch (error) {
        // If decoding fails, assume it's a transfer transaction
        console.warn("Failed to decode transaction data:", error);
    }

    const getMemberAddress = () => {
        if (
            transactionType === "addOwner" ||
            transactionType === "removeOwner"
        ) {
            // Try to decode the transaction data to get the member address
            try {
                if (transaction[2] && transaction[2].length > 0) {
                    const decoded = decodeFunctionData({
                        abi: MultiSigWalletAbi,
                        data: transaction[2],
                    });
                    if (
                        (decoded.functionName === "addOwner" ||
                            decoded.functionName === "removeOwner") &&
                        decoded.args[0]
                    ) {
                        return decoded.args[0] as string;
                    }
                }
            } catch (error) {
                // If decoding fails, return unknown
                console.warn("Failed to decode transaction data:", error);
                return "Unknown";
            }
        }
        return undefined;
    };

    const contentProps = {
        txIndex,
        isTransactionRefetching,
        numConfirmations: transaction[4],
        numConfirmationsRequired,
    };

    return (
        <Card className="w-xl">
            {transactionType === "transfer" && (
                <CompletedTransferContent
                    {...contentProps}
                    toAddress={transaction[0]}
                    value={transaction[1]}
                />
            )}
            {transactionType === "addOwner" && (
                <CompletedManageMemberContent
                    {...contentProps}
                    memberAddress={getMemberAddress()!}
                    isAdding={true}
                />
            )}
            {transactionType === "removeOwner" && (
                <CompletedManageMemberContent
                    {...contentProps}
                    memberAddress={getMemberAddress()!}
                    isAdding={false}
                />
            )}
        </Card>
    );
}
