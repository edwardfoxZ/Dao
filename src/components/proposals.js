import React, { useState, useEffect } from "react";
import UseWeb3 from "../hooks/useWeb3";
import Dao from "../contracts/Dao.json";

const Proposals = () => {
  const { web3Api, setWeb3Api } = UseWeb3();
  const { contract, currentAccount, isLoading } = web3Api;
  const [proposalsList, setProposalsList] = useState([]);
  const [userShares, setUserShares] = useState(0);

  const fetchData = async () => {
    if (contract && web3Api.currentAccount) {
      try {
        const shares = await contract.methods
          .shares(web3Api.currentAccount)
          .call();
        const sharesInEther = await web3Api.web3.utils.fromWei(shares, "ether");
        setUserShares(sharesInEther);

        const networkId = await web3Api.web3.eth.net.getId();
        const deploymentNetwork = Dao.networks[networkId];
        const contractInstance = new web3Api.web3.eth.Contract(
          Dao.abi,
          deploymentNetwork.address
        );
        const account = await web3Api.web3.eth.getAccounts();
        setWeb3Api({ contract: contractInstance, currentAccount: account[0] });
        const totalProposals = await contract.methods.nextProposalId().call();
        const proposals = [];
        for (let i = 0; i < totalProposals; i++) {
          const proposal = await contract.methods.proposals(i).call();
          if (proposal.creator === currentAccount) {
            proposals.push(proposal);
          }
        }
        setProposalsList(proposals);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [contract, currentAccount]);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    const name = e.target.elements.proposalName.value.trim();
    if (!name) return;

    try {
      await contract.methods
        .createProposal(name)
        .send({ from: currentAccount });

      // Refresh proposals after successful creation
      fetchData();
      e.target.reset();
    } catch (error) {
      console.error("Error creating proposal:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white rounded-lg shadow-lg">
      {/* User has shares */}
      {console.log(
        web3Api.currentAccount,
        web3Api.accounts,
        web3Api.web3,
        web3Api.contract
      )}
      {userShares > 0 ? (
        <>
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <input
              type="text"
              placeholder="Enter proposal name"
              name="proposalName"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full p-3 rounded-md text-white ${
                isLoading ? "bg-gray-400" : "bg-blue-500"
              }`}
            >
              {isLoading ? "Creating..." : "Create Proposal"}
            </button>
          </form>
          <h3 className="text-xl font-semibold mt-6">Your Proposals</h3>
          {proposalsList.length === 0 ? (
            <p className="text-gray-500">
              You have not created any proposals yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {proposalsList.map((proposal, index) => (
                <li
                  key={index}
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {proposal.name}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-gray-500">
          You must hold shares to create a proposal. Please contribute to
          participate.
        </p>
      )}
    </div>
  );
};

export default Proposals;
