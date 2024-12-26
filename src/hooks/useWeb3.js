import { useEffect, useState } from "react";
import { Web3 } from "web3";
import Dao from "../contracts/Dao.json";
import detectEthereumProvider from "@metamask/detect-provider";

const UseWeb3 = () => {
  const [web3Api, setWeb3Api] = useState({
    web3: null,
    provider: null,
    contract: null,
    availableFunds: 0,
    accounts: [],
    currentAccount: null,
    status: null,
    isLoading: true,
    isError: true,
  });

  useEffect(() => {
    const loadingContract = async () => {
      const provider = await detectEthereumProvider();
      const networkId = await web3Instance.eth.net.getId();
      const deploymentNetwork = Dao.networks[networkId];

      if (!deploymentNetwork) {
        console.error("Smart contract not deployed to the detected network.");
        setWeb3Api((api) => ({
          ...api,
          isLoading: false,
          status: "Smart contract not deployed.",
        }));
        return;
      }
      await provider.request({ method: "eth_requestAccounts" });

      const web3Instance = new Web3(provider);

      const contractInstance = new web3Instance.eth.Contract(
        Dao.abi,
        deploymentNetwork.address
      );

      setWeb3Api({ contract: contractInstance });
    };
  }, []);

  return { web3Api, setWeb3Api };
};

export default UseWeb3;
