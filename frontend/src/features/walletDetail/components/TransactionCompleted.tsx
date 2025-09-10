import { useParams } from "react-router";

export function TransactionCompleted() {
    const { walletAddress } = useParams();
    
    return <div>TransactionCompleted {walletAddress}</div>;
}
