import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { useNavigate, useLocation, useParams } from "react-router";
import { CreateTransaction } from "./CreateTransaction";

export function WalletDetailNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { walletAddress } = useParams();
    const { toggleSidebar, open } = useSidebar();

    // Derive active tab from the current pathname
    const currentTab = location.pathname.includes("pending")
        ? "pending"
        : "completed";

    return (
        <div className="flex flex-col gap-2 w-xl">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Tabs
                        value={currentTab}
                        onValueChange={(val) =>
                            navigate(`/wallet/${walletAddress}/${val}`)
                        }
                    >
                        <TabsList>
                            <TabsTrigger value="completed">
                                Completed
                            </TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <CreateTransaction />
                </div>
                <Button variant="outline" onClick={toggleSidebar}>
                    {open ? "Hide Wallet Info" : "Show Wallet Info"}
                </Button>
            </div>
        </div>
    );
}
