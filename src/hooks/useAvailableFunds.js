import React, { useEffect, useState } from "react";
import UseWeb3 from "./useWeb3";

const useAvailableFunds = () => {
  const [availabeFunds, setAvailableFunds] = useState(0);
  const { setWeb3Api, web3Api } = UseWeb3();
  const { contract, web3 } = web3Api;
  useEffect(() => {
    if (contract) {
      const loadFunds = async () => {
        try {
          const funds = await contract.methods.availabeFunds().call();
          const fundsInEther = web3.utils.fromWei(funds, "ether");
          setAvailableFunds(fundsInEther);

          if (parseFloat(fundsInEther) > 0) {
            setIsAllowedToCreate(true);
          }
        } catch (error) {
          console.error("Error fetching funds:", error);
          setWeb3Api((api) => ({
            ...api,
            status: "Error fetching funds.",
          }));
        }
      };
      loadFunds();
    }
  }, [contract, web3]);
  return { availabeFunds };
};

export default useAvailableFunds;
