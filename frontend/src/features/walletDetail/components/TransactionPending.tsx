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
import { formatEther, type Abi } from "viem";
import { Badge } from "@/components/ui/badge";
import { PendingTransactionCard } from "./PendingTransactionCard";

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

    const [isConfirmed, setIsConfirmed] = useState<boolean[]>([]);

    // Get required confirmations
    const {
        data: numConfirmationsRequired,
        isLoading: isNumConfirmationsLoading,
        error: getNumConfirmationsError,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "numConfirmationsRequired",
    });

    // Get all transactions
    const {
        data: transactions,
        isPending: isTransactionsPending,
        isRefetching: isTransactionsRefetching,
        error: getTransactionsError,
        queryKey: getTransactionsQueryKey,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getAllTransactions",
    });

    const gotTransactions = transactions && transactions.length > 0;

    let isConfirmedReads: readonly {
        address: `0x${string}`;
        abi: Abi;
        functionName: string;
        args: (bigint | `0x${string}`)[];
    }[] = [];

    if (gotTransactions) {
        isConfirmedReads = transactions.map((_, index) => ({
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
        isRefetching: isRefetchingIsConfirmed,
        error: getIsConfirmedError,
    } = useReadContracts({
        contracts: isConfirmedReads,
        query: {
            enabled: !!transactions,
        },
    });

    useEffect(() => {
        if (isConfirmedData && isConfirmedData.length > 0) {
            setIsConfirmed(
                isConfirmedData.map((item) => item.result as boolean)
            );
        }
    }, [isConfirmedData]);

    return (
        <div className="space-y-4">
            {transactions?.map((tx, index) => {
                let canExecute: boolean;
                if (!numConfirmationsRequired) {
                    canExecute = false;
                } else {
                    canExecute =
                        tx.numConfirmations >= numConfirmationsRequired;
                }

                if (tx.executed) {
                    return null;
                }

                return (
                    <PendingTransactionCard
                        txIndex={index}
                        isExecutable={canExecute}
                        isConfirmed={false}
                        numConfirmations={tx.numConfirmations}
                        numConfirmationsRequired={
                            numConfirmationsRequired ?? 0n
                        }
                        to={tx.to}
                        value={tx.value}
                        data={tx.data}
                        getTransactionsQueryKey={getTransactionsQueryKey}
                        isRefreshing={isTransactionsRefetching}
                    />
                );
            })}
        </div>
    );
}
