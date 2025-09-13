import {
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther } from "viem";
import { Badge } from "@/components/ui/badge";

interface TransferEtherContentProps {
    txIndex: number;
    isTransactionRefetching: boolean;
    isExecutable: boolean;
    toAddress: string;
    value: bigint;
    numConfirmations: bigint;
    numConfirmationsRequired: bigint;
}

export const TransferEtherContent = (
    props: Readonly<TransferEtherContentProps>
) => {
    const {
        txIndex,
        isTransactionRefetching,
        isExecutable,
        toAddress,
        value,
        numConfirmations,
        numConfirmationsRequired,
    } = props;

    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Transaction #{txIndex}
                    </CardTitle>
                    {isTransactionRefetching ? (
                        <Skeleton className="h-8 w-32" />
                    ) : (
                        <Badge variant={isExecutable ? "default" : "secondary"}>
                            {numConfirmations}/{numConfirmationsRequired}{" "}
                            confirmations
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    To: <span className="font-mono text-sm">{toAddress}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm">
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
            </CardContent>
        </>
    );
};
