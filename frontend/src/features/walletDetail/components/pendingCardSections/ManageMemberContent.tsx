import {
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus } from "lucide-react";

interface ManageMemberContentProps {
    txIndex: number;
    isTransactionRefetching: boolean;
    isExecutable: boolean;
    numConfirmations: bigint;
    numConfirmationsRequired: bigint;
    memberAddress: string;
    isAdding: boolean;
}

export const ManageMemberContent = (
    props: Readonly<ManageMemberContentProps>
) => {
    const {
        txIndex,
        isTransactionRefetching,
        isExecutable,
        numConfirmations,
        numConfirmationsRequired,
        memberAddress,
        isAdding,
    } = props;

    const cardTitle = isAdding ? "Add Owner" : "Remove Owner";

    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {isAdding ? (
                            <UserPlus className="h-5 w-5 text-green-500" />
                        ) : (
                            <UserMinus className="h-5 w-5 text-red-500" />
                        )}
                        {cardTitle} Transaction #{txIndex}
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
                    {cardTitle}:{" "}
                    <span className="font-mono text-sm">{memberAddress}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <span className="font-medium">Type:</span>
                        <span className="ml-2">{cardTitle}</span>
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
