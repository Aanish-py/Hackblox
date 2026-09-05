import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { TransactionToastProvider } from "./components/TransactionToast";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <TransactionToastProvider>
          <App />
        </TransactionToastProvider>
      </WalletProvider>
    </BrowserRouter>
  </StrictMode>
);
