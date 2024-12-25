const Dao = artifacts.require("Dao");

module.exports = function (deployer, accounts) {
  deployer.deploy(Dao, 3600, 3600, 50);
};
