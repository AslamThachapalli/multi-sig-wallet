import { CompletedTransactionCard } from "./CompletedTransactionCard";
import { useMultiSigWalletInfo } from "@/hooks/useMultiSigWallet";

export function TransactionCompleted() {
    const {
        numConfirmationsRequired,
        transactionsCount,
        isLoading: isLoadingMultiSigWalletInfo,
        getNumConfirmationsError,
        getTransactionsCountError,
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
                        <CompletedTransactionCard
                            key={index}
                            txIndex={index}
                            numConfirmationsRequired={numConfirmationsRequired!}
                        />
                    );
                }
            )}
        </div>
    );
}
