// src/wagmi.ts
import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [mainnet.id]: http(), // usa RPC público; troque se quiser Alchemy/Infura
  },
  autoConnect: true,
});
