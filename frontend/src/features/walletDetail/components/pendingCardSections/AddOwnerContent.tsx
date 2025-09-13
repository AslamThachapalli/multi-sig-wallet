import {
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";

interface AddOwnerContentProps {
    txIndex: number;
    isTransactionRefetching: boolean;
    isExecutable: boolean;
    numConfirmations: bigint;
    numConfirmationsRequired: bigint;
    ownerAddressToAdd: string;
}

export const AddOwnerContent = (props: Readonly<AddOwnerContentProps>) => {
    const {
        txIndex,
        isTransactionRefetching,
        isExecutable,
        numConfirmations,
        numConfirmationsRequired,
        ownerAddressToAdd,
    } = props;

    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-500" />
                        Add Owner Transaction #{txIndex}
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
                    Add Owner:{" "}
                    <span className="font-mono text-sm">
                        {ownerAddressToAdd}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <span className="font-medium">Type:</span>
                        <span className="ml-2">Add Owner</span>
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
