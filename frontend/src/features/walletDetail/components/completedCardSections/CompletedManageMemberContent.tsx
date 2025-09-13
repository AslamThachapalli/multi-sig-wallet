import {
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, UserPlus, UserMinus } from "lucide-react";

interface CompletedManageMemberContentProps {
    txIndex: number;
    isTransactionRefetching: boolean;
    numConfirmations: bigint;
    numConfirmationsRequired: bigint;
    memberAddress: string;
    isAdding: boolean;
}

export const CompletedManageMemberContent = (
    props: Readonly<CompletedManageMemberContentProps>
) => {
    const {
        txIndex,
        isTransactionRefetching,
        numConfirmations,
        numConfirmationsRequired,
        memberAddress,
        isAdding,
    } = props;

    const Icon = isAdding ? UserPlus : UserMinus;
    const actionText = isAdding ? "Add Owner" : "Remove Owner";
    const iconColor = isAdding ? "text-blue-500" : "text-red-500";

    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {actionText} Transaction #{txIndex}
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
                <CardDescription className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                    {actionText}:{" "}
                    <span className="font-mono text-sm">{memberAddress}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <span className="font-medium">Type:</span>
                            <span className="ml-2">{actionText}</span>
                        </div>
                        <div>
                            <span className="font-medium">Confirmations:</span>
                            <span className="ml-2 font-mono">
                                {numConfirmations}/{numConfirmationsRequired}
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
        </>
    );
};
