import "./App.css";

import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";

const projectId = import.meta.env.VITE_PROJECT_ID as string;

type EProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

// 1. Create a new EthereumProvider instance
function createProvider(chainId: number): Promise<EProvider> {
  console.log("createProvider", chainId);
  return EthereumProvider.init({
    projectId,
    chains: [chainId],
    methods: ["personal_sign", "eth_sendTransaction"],
    showQrModal: true,
    qrModalOptions: {
      themeMode: "light",
    },
    rpcMap: {
      [20197]: "https://rpc.sandverse.oasys.games",
      [40875]: "https://rpc.testnet.oasys.homeverse.games",
    },
  });
}

// 2. Pass the provider to ethers.js

function App() {
  const [chainId, setChainId] = useState<number>(1);
  const [provider, setProvider] = useState<EProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const ethersWeb3Provider = provider != null ? new ethers.providers.Web3Provider(provider) : null;

  useEffect(() => {
    createProvider(chainId).then((provider) => {  
      setProvider(provider);
      provider.on("display_uri", (uri) => {
        console.log("display_uri", uri);
      });
    }).catch((error) => {
      console.error("Failed to create provider", error);
    });
  },[chainId]);

  // 3. Handle Connect
  const connect = () => {
    if (provider === null) {
      console.log("provider is null in connect");
      return;
    }
    provider.connect().then(() => {
      console.log("connected");
      setConnected(true);
    }).catch((error) => {
      console.error("Failed to connect");
      console.error(error);
    });
  };

  // 4. Fetch Balance on click with ethers.js
  const getBalance = async () => {
    if (provider === null) {
      console.log("provider is null in getBalance");
      return;
    }
    console.log("signer", provider.accounts[0]);
    console.log("signer", ethersWeb3Provider!.getSigner(provider.accounts[0]));
    const balanceFromEthers = await ethersWeb3Provider!
      .getSigner(provider.accounts[0])
      .getBalance();
      console.log("balanceFromEthers", balanceFromEthers);
    const remainder = balanceFromEthers.mod(1e14);
    setBalance(ethers.utils.formatEther(balanceFromEthers.sub(remainder)));
  };

  // 5. Handle Disconnect
  const refresh = () => {
    if (provider === null) {
      console.log("provider is null in refresh");
      return;
    } else {
      provider.disconnect();
    }
    window.localStorage.clear();
    setConnected(false);
  };

  if (connected) {
    return (
      <>
        <button onClick={getBalance}>Balance</button>
        <button onClick={refresh}>Refresh</button>
        <p>
          balance: {balance ? `${balance} ETH` : `click "Balance" to fetch`}
        </p>
      </>
    );
  }
  return (
    <>
      <p>chainId: {chainId} </p>
      <button onClick={() => setChainId(20197)}>Sandverse</button>
      <button onClick={() => setChainId(40875)}>Homeverse test</button>
      <button onClick={connect}>Connect with ethereum-provider</button>
    </>
  );
}

export default App;
