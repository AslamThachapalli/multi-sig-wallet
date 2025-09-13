import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { useEffect } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { useReadContract } from "wagmi";

export const useMultiSigWalletInfo = () => {
    const { walletAddress } = useParams();

    const {
        data: numConfirmationsRequired,
        isLoading: isNumConfirmationsLoading,
        error: getNumConfirmationsError,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "numConfirmationsRequired",
    });

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

    return {
        numConfirmationsRequired,
        transactionsCount,
        isLoading: isNumConfirmationsLoading || isTransactionsCountPending,
        getNumConfirmationsError,
        getTransactionsCountError,
        getTransactionsCountQueryKey,
    };
};
