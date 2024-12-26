import "./App.css";
import { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import UseWeb3 from "./hooks/useWeb3";
import Proposals from "./components/proposals";
import useShares from "./hooks/useShares";
import useAvailableFunds from "./hooks/useAvailableFunds";

function App() {
  const { web3Api, setWeb3Api } = UseWeb3();
  const { contract, isLoading, web3, status, isError } = web3Api;
  const { isAllowedToCreate, shares } = useShares();
  const { availabeFunds } = useAvailableFunds();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const provider = await detectEthereumProvider();

        if (!provider) {
          console.error("Please install MetaMask!");
          setWeb3Api((api) => ({
            ...api,
            isLoading: false,
            status: "MetaMask not installed.",
          }));
          return;
        }

        const web3Instance = new Web3(provider);

        await provider.request({ method: "eth_requestAccounts" });

        const accounts = await web3Instance.eth.getAccounts();

        window.ethereum.on("accountsChanged", (accounts) => {
          setWeb3Api({ accounts: accounts });
        });

        setWeb3Api({
          currentAccount: accounts[0],
          web3: web3Instance,
          provider: provider,
          isLoading: false,
          accounts: accounts,
          status: "Connected",
        });
      } catch (error) {
        console.error("Error loading provider:", error);
        setWeb3Api((api) => ({
          ...api,
          isLoading: false,
          status: "Error loading provider.",
        }));
      }
    };

    loadProvider();
  }, [setWeb3Api]);

  const handleSendBu = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        setWeb3Api((api) => ({
          ...api,
          status: "Transaction in progress...",
        }));

        if (!web3 || !contract || !amount || isNaN(amount) || amount <= 0) {
          setWeb3Api((api) => ({
            ...api,
            status: "Invalid input or missing contract.",
          }));
          return;
        }

        const amountToEther = web3.utils.toWei(amount, "ether");
        await contract.methods.contribute().send({
          from: web3Api.accounts[0],
          value: amountToEther,
        });

        setWeb3Api((api) => ({
          ...api,
          status: `Contribution of ${amount} ETH successful.`,
        }));

        const updatedFunds = await contract.methods.availabeFunds().call();
        setWeb3Api({
          availableFunds: web3.utils.fromWei(updatedFunds, "ether"),
        });
      } catch (error) {
        console.error("Transaction failed:", error);
        setWeb3Api((api) => ({
          ...api,
          isError: true,
          status: "Transaction failed.",
        }));
      }
    },
    [web3, contract, amount, web3Api.accounts, setWeb3Api]
  );

  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center p-4">
        <h1 className="text-2xl font-bold mb-4">
          DAO - Decentralized Autonomous Organization
        </h1>
        <p
          className={`font-mono ${isError ? "text-red-500" : "text-green-500"}`}
        >
          Status: {status}
        </p>
        {availabeFunds > 0 && (
          <p className="font-mono mt-4">
            Contract Balance: {availabeFunds} ETH
          </p>
        )}
        <p className="font-mono mt-4">Your Shares: {shares} ETH</p>
      </div>

      <div className="w-full max-w-lg mx-auto mt-10 p-4 bg-white shadow-lg rounded-lg">
        <form className="w-full flex flex-col gap-5">
          <input
            type="text"
            className="w-full p-3 border rounded-md"
            placeholder="Enter contribution amount"
            value={amount}
            onChange={handleAmountChange}
          />
          <button
            type="button"
            onClick={handleSendBu}
            disabled={!amount || isLoading || status !== "Connected"}
            className={`w-full p-3 rounded-xl text-white ${
              amount && status === "Connected" ? "bg-black" : "bg-gray-400"
            } transition-all duration-500`}
          >
            Send
          </button>
        </form>

        {isAllowedToCreate && <Proposals />}
      </div>
    </main>
  );
}

export default App;
