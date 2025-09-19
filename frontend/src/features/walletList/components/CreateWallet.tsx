import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { MultiSigFactoryAbi } from "@/lib/multiSigFactoryAbi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { isAddress, decodeEventLog } from "viem";

interface CreateWalletProps {
    onWalletCreated?: (walletAddress: string, walletName: string) => void;
}

interface OwnerInput {
    id: string;
    address: string;
}

export function CreateWallet({ onWalletCreated }: CreateWalletProps) {
    const { address } = useAccount();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [walletName, setWalletName] = useState("");
    const [owners, setOwners] = useState<OwnerInput[]>([]);
    const [numConfirmationsRequired, setNumConfirmationsRequired] =
        useState("1");
    const [errors, setErrors] = useState<{
        walletName?: string;
        owners?: string[];
        numConfirmations?: string;
    }>({});

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        data: receipt,
    } = useWaitForTransactionReceipt({
        hash,
    });

    // Initialize with current user as owner
    useEffect(() => {
        if (address && owners.length === 0) {
            setOwners([{ id: "1", address: address }]);
        }
    }, [address, owners.length]);

    useEffect(() => {
        if (error) {
            toast.error("Failed to create wallet: " + error.name);
            return;
        }

        if (isConfirmed && receipt) {
            // Extract wallet address from the WalletCreated event
            let walletAddress = "";

            try {
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi: MultiSigFactoryAbi,
                            data: log.data,
                            topics: log.topics,
                        });

                        if (
                            decoded.eventName === "WalletCreated" &&
                            decoded.args
                        ) {
                            walletAddress = decoded.args.wallet as string;
                            break;
                        }
                    } catch (e) {
                        // Skip logs that don't match our ABI
                        continue;
                    }
                }
            } catch (e) {
                console.error("Error decoding event logs:", e);
            }

            if (walletAddress) {
                toast.success("Wallet created successfully!");
                handleDialogClose();

                // Add wallet to localStorage
                if (address) {
                    const walletsStr = localStorage.getItem("wallets");
                    const wallets = walletsStr ? JSON.parse(walletsStr) : {};
                    const updatedWallets = {
                        ...wallets,
                        [address]: [
                            ...(wallets[address] || []),
                            {
                                walletAddress,
                                walletName,
                            },
                        ],
                    };
                    localStorage.setItem(
                        "wallets",
                        JSON.stringify(updatedWallets)
                    );
                }

                if (onWalletCreated) {
                    onWalletCreated(walletAddress, walletName);
                }
            } else {
                toast.error("Wallet created but could not extract address");
            }
        }
    }, [isConfirmed, error, receipt]);

    const validateWalletName = (name: string) => {
        if (!name.trim()) {
            return "Wallet name is required";
        }
        if (name.trim().length < 2) {
            return "Wallet name must be at least 2 characters";
        }
        return "";
    };

    const validateOwnerAddress = (addr: string) => {
        if (!addr.trim()) {
            return "Address is required";
        }
        if (!isAddress(addr)) {
            return "Invalid Ethereum address format";
        }
        return "";
    };

    const validateNumConfirmations = (num: string) => {
        const numValue = parseInt(num);
        if (!num || isNaN(numValue) || numValue < 1) {
            return "Number of confirmations must be at least 1";
        }
        if (numValue > owners.length) {
            return "Number of confirmations cannot exceed number of owners";
        }
        return "";
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        // Validate wallet name
        const walletNameError = validateWalletName(walletName);
        if (walletNameError) {
            newErrors.walletName = walletNameError;
        }

        // Validate owners
        const ownerErrors: string[] = [];
        const uniqueAddresses = new Set<string>();

        owners.forEach((owner, index) => {
            const addressError = validateOwnerAddress(owner.address);
            if (addressError) {
                ownerErrors[index] = addressError;
            }

            // Check for duplicates
            if (uniqueAddresses.has(owner.address.toLowerCase())) {
                ownerErrors[index] = "Duplicate address";
            } else {
                uniqueAddresses.add(owner.address.toLowerCase());
            }
        });

        if (ownerErrors.some((error) => error)) {
            newErrors.owners = ownerErrors;
        }

        // Validate num confirmations
        const numConfirmationsError = validateNumConfirmations(
            numConfirmationsRequired
        );
        if (numConfirmationsError) {
            newErrors.numConfirmations = numConfirmationsError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addOwner = () => {
        const newId = (owners.length + 1).toString();
        setOwners([...owners, { id: newId, address: "" }]);
    };

    const removeOwner = (id: string) => {
        if (owners.length <= 1) {
            toast.error("At least one owner is required");
            return;
        }
        setOwners(owners.filter((owner) => owner.id !== id));
    };

    const updateOwnerAddress = (id: string, address: string) => {
        setOwners(
            owners.map((owner) =>
                owner.id === id ? { ...owner, address } : owner
            )
        );
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const ownerAddresses = owners.map(
            (owner) => owner.address as `0x${string}`
        );
        const numConfirmations = parseInt(numConfirmationsRequired);

        writeContract({
            address: CONTRACT_ADDRESSES.MULTISIG_FACTORY,
            abi: MultiSigFactoryAbi,
            functionName: "createWallet",
            args: [ownerAddresses, BigInt(numConfirmations)],
        });
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setWalletName("");
        setNumConfirmationsRequired("1");
        setOwners([]);
        setErrors({});
    };

    const isLoading = isPending || isConfirming;
    const isFormValid =
        !errors.walletName &&
        !errors.owners?.some((error) => error) &&
        !errors.numConfirmations &&
        walletName.trim() &&
        owners.every((owner) => owner.address.trim());

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>Create Wallet</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New MultiSig Wallet</DialogTitle>
                    <DialogDescription>
                        Create a new multi-signature wallet with multiple owners
                        and confirmation requirements.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    {/* Wallet Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="wallet-name">Wallet Name</Label>
                        <Input
                            id="wallet-name"
                            placeholder="My MultiSig Wallet"
                            value={walletName}
                            onChange={(e) => setWalletName(e.target.value)}
                            className={
                                errors.walletName ? "border-destructive" : ""
                            }
                        />
                        {errors.walletName && (
                            <p className="text-xs text-destructive">
                                {errors.walletName}
                            </p>
                        )}
                    </div>

                    {/* Owners */}
                    <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label>Owners</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOwner}
                                disabled={isLoading}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Owner
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {owners.map((owner, index) => (
                                <div key={owner.id} className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="0x..."
                                            value={owner.address}
                                            onChange={(e) =>
                                                updateOwnerAddress(
                                                    owner.id,
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                errors.owners?.[index]
                                                    ? "border-destructive"
                                                    : ""
                                            }
                                            readOnly={owner.address === address}
                                        />
                                        {errors.owners?.[index] && (
                                            <p className="text-xs text-destructive mt-1">
                                                {errors.owners[index]}
                                            </p>
                                        )}
                                    </div>
                                    {owners.length > 1 &&
                                        owner.address !== address && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    removeOwner(owner.id)
                                                }
                                                disabled={isLoading}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Number of Confirmations Required */}
                    <div className="grid gap-2">
                        <Label htmlFor="num-confirmations">
                            Confirmations Required
                        </Label>
                        <Input
                            id="num-confirmations"
                            type="number"
                            min="1"
                            max={owners.length}
                            value={numConfirmationsRequired}
                            onChange={(e) =>
                                setNumConfirmationsRequired(e.target.value)
                            }
                            className={
                                errors.numConfirmations
                                    ? "border-destructive"
                                    : ""
                            }
                        />
                        {errors.numConfirmations && (
                            <p className="text-xs text-destructive">
                                {errors.numConfirmations}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Out of {owners.length} owner(s)
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        disabled={isLoading || !isFormValid}
                        onClick={handleSubmit}
                    >
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        {isLoading ? "Creating..." : "Create Wallet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
