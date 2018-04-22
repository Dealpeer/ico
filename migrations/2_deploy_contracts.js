var DPRToken = artifacts.require('DPRToken.sol');
var PreICO = artifacts.require('PreICO.sol');
const Fund = artifacts.require("funds/FundsRegistry.sol");

const Owners = [
    '0x7341237Df96b0eBB8b1FD093c5b5A2BDa7859F26', 
    '0x9AB42521346b0E91dFb5CDad610C0464278F1400',
    '0x61588aE468378120403B98c891F6e72AC490a624'
]

module.exports = async (deployer) => {
    
    const now = parseInt(new Date().getTime()/1000);
    const start = now;
    const end = now + (60*60);

    deployer.deploy(Fund, Owners, 2)
        .then(() => {
            //return deployer.deploy(DPRToken, Owners);
        })
        .then(() => {
            //return deployer.deploy(PreICO,Owners, 2, Fund.address, DPRToken.address, 40000, 43000000);
        }); 
};