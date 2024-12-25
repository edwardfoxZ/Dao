import { useState } from "react";

const UseWeb3 = () => {
  const [web3Api, setWeb3Api] = useState({
    web3: null,
    provider: null,
    contract: null,
    accounts: [],
    currentAccount: null,
    status: null,
    isLoading: true,
    isError: true,
  });

  return { web3Api, setWeb3Api };
};

export default UseWeb3;
