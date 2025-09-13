import { Card, CardFooter } from "@/components/ui/card";
import { decodeFunctionData } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { useQueryClient } from "@tanstack/react-query";
import { PendingTransactionActions } from "./pendingCardSections/PendingTransactionActions";
import { TransferEtherContent } from "./pendingCardSections/TransferEtherContent";
import { ManageMemberContent } from "./pendingCardSections/ManageMemberContent";

interface PendingTransactionCardProps {
    txIndex: number;
    numConfirmationsRequired: bigint;
    getTransactionsCountQueryKey: readonly unknown[];
}

type TransactionType = "addOwner" | "removeOwner" | "transfer";

export function PendingTransactionCard(
    props: Readonly<PendingTransactionCardProps>
) {
    const { txIndex, numConfirmationsRequired, getTransactionsCountQueryKey } =
        props;

    const { walletAddress } = useParams();
    const { address: userAddress } = useAccount();
    const queryClient = useQueryClient();

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
        queryKey: getIsConfirmedQueryKey,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "isConfirmed",
        args: [BigInt(txIndex), userAddress as `0x${string}`],
    });

    const { data: balance, refetch: refetchBalance } = useBalance({
        address: walletAddress as `0x${string}`,
    });

    const { refetch: refetchOwners } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getOwners",
    });

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

    const handleOnTransactionConfimedOrRevoked = () => {
        queryClient.invalidateQueries({
            queryKey: getIsConfirmedQueryKey,
        });
        queryClient.invalidateQueries({
            queryKey: getTransactionsCountQueryKey,
        });
        queryClient.invalidateQueries({
            queryKey: getTransactionQueryKey,
        });
    };

    const handleOnTransactionExecuted = () => {
        queryClient.invalidateQueries({
            queryKey: getTransactionsCountQueryKey,
        });
        queryClient.invalidateQueries({
            queryKey: getTransactionQueryKey,
        });

        switch (transactionType) {
            case "transfer":
                refetchBalance();
                break;
            case "addOwner":
            case "removeOwner":
                refetchOwners();
                break;
        }
    };

    const getOwnerAddressToAdd = () => {
        if (transactionType === "addOwner") {
            // Try to decode the transaction data to get the owner address
            try {
                if (transaction[2] && transaction[2].length > 0) {
                    const decoded = decodeFunctionData({
                        abi: MultiSigWalletAbi,
                        data: transaction[2],
                    });
                    if (
                        decoded.functionName === "addOwner" &&
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

    const getOwnerAddressToRemove = () => {
        if (transactionType === "removeOwner") {
            // Try to decode the transaction data to get the owner address
            try {
                if (transaction[2] && transaction[2].length > 0) {
                    const decoded = decodeFunctionData({
                        abi: MultiSigWalletAbi,
                        data: transaction[2],
                    });
                    if (
                        decoded.functionName === "removeOwner" &&
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

    const isExecutable = transaction[4] >= numConfirmationsRequired;
    const isEnoughBalance = transaction[1] <= (balance?.value ?? 0n);

    const contentProps = {
        txIndex,
        isTransactionRefetching,
        isExecutable,
        numConfirmations: transaction[4],
        numConfirmationsRequired,
    };

    return (
        <Card key={txIndex} className="w-xl">
            {transactionType === "transfer" && (
                <TransferEtherContent
                    {...contentProps}
                    toAddress={transaction[0]}
                    value={transaction[1]}
                />
            )}
            {transactionType === "addOwner" && (
                <ManageMemberContent
                    {...contentProps}
                    memberAddress={getOwnerAddressToAdd()!}
                    isAdding={true}
                />
            )}
            {transactionType === "removeOwner" && (
                <ManageMemberContent
                    {...contentProps}
                    memberAddress={getOwnerAddressToRemove()!}
                    isAdding={false}
                />
            )}
            <CardFooter className="flex justify-end">
                <PendingTransactionActions
                    txIndex={txIndex}
                    isConfirmed={isConfirmed ?? false}
                    isConfirmedLoading={isConfirmedLoading}
                    isTransactionRefetching={isTransactionRefetching}
                    isExecutable={isExecutable}
                    isEnoughBalance={isEnoughBalance}
                    onTransactionConfirmed={
                        handleOnTransactionConfimedOrRevoked
                    }
                    onTransactionRevoked={handleOnTransactionConfimedOrRevoked}
                    onTransactionExecuted={handleOnTransactionExecuted}
                />
            </CardFooter>
        </Card>
    );
}
