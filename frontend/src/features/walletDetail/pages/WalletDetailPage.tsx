import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";
import {
    Outlet,
    useNavigate,
    useLocation,
    useParams,
} from "react-router";

export function WalletDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { walletAddress } = useParams();

    // Example validation: check if it's a 42-char Ethereum address
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(walletAddress ?? "");

    if (!isValid) {
        return <div>Invalid address</div>;
    }

    // Derive active tab from the current pathname
    const currentTab = location.pathname.includes("pending")
        ? "pending"
        : "completed";

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Transactions</h1>
                <Tabs
                    value={currentTab}
                    onValueChange={(val) =>
                        navigate(`/wallet/${walletAddress}/${val}`)
                    }
                >
                    <TabsList>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <Outlet />
        </div>
    );
}
