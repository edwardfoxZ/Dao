import { useEffect, useState } from "react";
import UseWeb3 from "./useWeb3";

const useShares = () => {
  const { web3Api } = UseWeb3();
  const [shares, setShares] = useState(0);
  const [isAllowedToCreate, setIsAllowedToCreate] = useState(false);
  const { contract, web3 } = web3Api;

  useEffect(() => {
    if (contract) {
      const loadShares = async () => {
        try {
          const shares = await contract.methods
            .shares(web3Api.currentAccount)
            .call();
          const sharesInEther = web3.utils.fromWei(shares, "ether");
          setShares(sharesInEther);

          // Example logic to set `isAllowedToCreate`
          setIsAllowedToCreate(parseFloat(sharesInEther) > 0);
        } catch (error) {
          console.error("Error fetching shares:", error);
        }
      };

      loadShares();
    }
  }, [contract, web3Api.currentAccount, web3]);
  console.log(shares)

  return { shares, isAllowedToCreate, setIsAllowedToCreate };
};

export default useShares;
