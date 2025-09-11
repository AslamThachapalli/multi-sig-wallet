import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { useParams } from "react-router";
import { toast } from "sonner";
import { useReadContract } from "wagmi";
import { PendingTransactionCard } from "./PendingTransactionCard";
import { useEffect } from "react";

export function TransactionPending() {
    const { walletAddress } = useParams();

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
        data: transactionsCount,
        isPending: isTransactionsCountPending,
        error: getTransactionsCountError,
        queryKey: getTransactionsCountQueryKey,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getTransactionCount",
    });

    useEffect(() => {
        if (getNumConfirmationsError || getTransactionsCountError) {
            toast.error("Error loading transactions");
        }
    }, [getNumConfirmationsError, getTransactionsCountError]);

    if (isTransactionsCountPending || isNumConfirmationsLoading) {
        return <div>Loading transactions...</div>;
    }

    if (getTransactionsCountError || getNumConfirmationsError) {
        return (
            <div className="flex flex-col space-y-4">
                {getNumConfirmationsError && (
                    <div>
                        Error loading confirmations:{" "}
                        {getNumConfirmationsError.shortMessage}
                    </div>
                )}
                {getTransactionsCountError && (
                    <div>
                        Error loading transactions:{" "}
                        {getTransactionsCountError.shortMessage}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Array.from({ length: Number(transactionsCount ?? 0) }).map(
                (_, index) => {
                    return (
                        <PendingTransactionCard
                            txIndex={index}
                            numConfirmationsRequired={numConfirmationsRequired!}
                            getTransactionsCountQueryKey={
                                getTransactionsCountQueryKey
                            }
                        />
                    );
                }
            )}
        </div>
    );
}
