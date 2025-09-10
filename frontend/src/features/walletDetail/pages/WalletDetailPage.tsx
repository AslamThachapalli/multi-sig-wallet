import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, useParams } from "react-router";
import { OwnersSidebar } from "../components/OwnersSidebar";
import { WalletDetailNavigation } from "../components/WalletDetailNavigation";
import { isAddress } from "viem";

export function WalletDetailPage() {
    const { walletAddress } = useParams();

    if (!isAddress(walletAddress ?? "")) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-3xl font-bold italic">
                    The address &apos;{walletAddress}&apos; is not a valid
                    Ethereum address.
                </p>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="max-w-2xl mx-auto py-16 flex flex-col gap-4">
                <OwnersSidebar />
                <WalletDetailNavigation />
                <Outlet />
            </div>
        </SidebarProvider>
    );
}
