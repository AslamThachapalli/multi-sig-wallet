import { useParams } from "react-router";

export function TransactionPending() {
    const { walletAddress } = useParams();
    
    return <div>TransactionPending {walletAddress}</div>;
}
