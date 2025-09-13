import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { useParams } from "react-router";
import { MultiSigWalletAbi } from "@/lib/multiSigContractAbi";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DepositEther } from "./DepositEther";
import { formatEther } from "viem";

export function OwnersSidebar() {
    const { walletAddress } = useParams();
    const { address } = useAccount();

    const {
        data: owners,
        isLoading,
        error,
    } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: MultiSigWalletAbi,
        functionName: "getOwners",
    });

    const {
        data: balance,
        isLoading: isBalanceLoading,
        error: balanceError,
        queryKey: balanceQueryKey,
    } = useBalance({
        address: walletAddress as `0x${string}`,
    });

    return (
        <Sidebar side="right" variant="sidebar">
            <SidebarContent className="h-full flex flex-col justify-center items-center gap-2 px-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="-ml-2 ">
                        Wallet Address
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="grid grid-cols-6 items-center">
                            <p className="text-md text-foreground tracking-widest col-span-4">
                                {walletAddress?.slice(0, 8)}...
                                {walletAddress?.slice(-4)}
                            </p>
                            <Button
                                className="col-span-2"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        walletAddress as string
                                    );
                                    toast.success(
                                        "Wallet address copied to clipboard"
                                    );
                                }}
                            >
                                <CopyIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </SidebarGroupContent>
                    <SidebarGroupLabel className="-ml-2 gap-1.5">
                        Wallet Balance{" "}
                        {isBalanceLoading ? (
                            <Skeleton className="h-5 w-16" />
                        ) : balanceError ? (
                            <Badge variant="destructive">Error</Badge>
                        ) : (
                            <Badge variant={"default"}>
                                {balance ? formatEther(balance.value) : "0"} ETH
                            </Badge>
                        )}
                    </SidebarGroupLabel>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="-ml-2 gap-1.5">
                        Required Confirmations{" "}
                        <p className="text-sm font-medium">3</p>
                    </SidebarGroupLabel>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="-ml-2">
                        Owners
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        {isLoading && (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                                <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                                <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                                <Skeleton className="h-4 w-[230px] bg-accent-foreground/15" />
                            </div>
                        )}
                        {!isLoading && error && (
                            <div className="space-y-2 text-center">
                                <p className="text-md text-foreground/50">
                                    Error fetching owners
                                </p>
                                <p className="text-sm text-foreground/50 italic">
                                    {error.shortMessage}
                                </p>
                            </div>
                        )}
                        {!isLoading &&
                            owners &&
                            owners.map((owner: string) => (
                                <div
                                    key={owner}
                                    className="grid grid-cols-5 items-center"
                                >
                                    <p className="text-md text-foreground tracking-widest col-span-3">
                                        {owner?.slice(0, 6)}...
                                        {owner?.slice(-4)}
                                    </p>
                                    <div className="col-span-2 flex items-center gap-0.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    owner
                                                );
                                                toast.success(
                                                    "Owner address copied to clipboard"
                                                );
                                            }}
                                        >
                                            <CopyIcon className="w-4 h-4" />
                                        </Button>
                                        {owner === address && (
                                            <div className=" w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </SidebarGroupContent>
                </SidebarGroup>
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
                <SidebarSeparator />
                <DepositEther balanceQueryKey={balanceQueryKey} />
            </SidebarFooter>
        </Sidebar>
    );
}
