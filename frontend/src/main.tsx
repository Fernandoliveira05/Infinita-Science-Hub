// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MetaMaskUIProvider } from "@metamask/sdk-react-ui";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "./wagmi";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
<WagmiConfig config={wagmiConfig}>
  <MetaMaskUIProvider sdkOptions={{ dappMetadata: { name: "Infinita Science Hub" }}}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MetaMaskUIProvider>
</WagmiConfig>

  </React.StrictMode>
);
