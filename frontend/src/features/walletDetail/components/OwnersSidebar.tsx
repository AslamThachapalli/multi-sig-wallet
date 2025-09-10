import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { useAccount, useReadContract } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OwnersSidebar() {
    const { walletAddress } = useParams();
    const { address } = useAccount();

    const {
        data: owners,
        isPending,
        error,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getOwners",
    });

    const gotOwners = !isPending && !error;

    return (
        <Sidebar side="right" variant="sidebar">
            <SidebarContent className="h-full flex flex-col justify-center items-center gap-2 px-4">
                <h2 className="text-lg font-bold text-foreground">Owners</h2>
                {isPending && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                        <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                        <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                        <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                    </div>
                )}
                {error && (
                    <div className="space-y-2 text-center">
                        <p className="text-md text-foreground/50">
                            Error fetching owners
                        </p>
                        <p className="text-sm text-foreground/50 italic">
                            {error.message}
                        </p>
                    </div>
                )}
                {gotOwners && (
                    <div>
                        {(owners as string[]).map((owner: string) => (
                            <div
                                key={owner}
                                className="flex items-center justify-between gap-1 relative"
                            >
                                {owner === address && (
                                    <div className="absolute -left-4  w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                )}
                                <p className="text-md text-foreground tracking-widest">
                                    {owner?.slice(0, 6)}...{owner?.slice(-4)}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        navigator.clipboard.writeText(owner);
                                        toast.success("Copied to clipboard");
                                    }}
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </SidebarContent>
            <SidebarFooter>
                <Button
                    variant="outline"
                    onClick={() => {
                        navigator.clipboard.writeText(walletAddress as string);
                        toast.success("Copied to clipboard");
                    }}
                >
                    Add Owner
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        navigator.clipboard.writeText(walletAddress as string);
                        toast.success("Copied to clipboard");
                    }}
                >
                    Remove Owner
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
