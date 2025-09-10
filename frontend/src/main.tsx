import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

import { WalletListPage } from "./features/walletList";
import {
    TransactionCompleted,
    TransactionPending,
    WalletDetailPage,
} from "./features/walletDetail";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        <Route index element={<WalletListPage />} />
                        <Route
                            path="/wallet/:walletAddress"
                            element={<WalletDetailPage />}
                        >
                            <Route
                                index
                                element={<Navigate to="completed" replace />}
                            />
                            <Route
                                path="completed"
                                element={<TransactionCompleted />}
                            />
                            <Route
                                path="pending"
                                element={<TransactionPending />}
                            />
                        </Route>
                    </Routes>
                </BrowserRouter>
                <Toaster />
            </QueryClientProvider>
        </WagmiProvider>
    </StrictMode>
);
