import { PendingTransactionCard } from "./PendingTransactionCard";
import { useMultiSigWalletInfo } from "@/hooks/useMultiSigWallet";

export function TransactionPending() {
    const {
        numConfirmationsRequired,
        transactionsCount,
        isLoading: isLoadingMultiSigWalletInfo,
        getNumConfirmationsError,
        getTransactionsCountError,
        getTransactionsCountQueryKey,
    } = useMultiSigWalletInfo();

    if (isLoadingMultiSigWalletInfo) {
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
