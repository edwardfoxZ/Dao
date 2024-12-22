const Dao = artifacts.require("Dao");

module.exports = function (deployer, accounts) {
  deployer.deploy(Dao, 90, 90, 67);
};
