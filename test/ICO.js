'use strict';
var BigNumber = require('big-number');
var expectRevert = require('./helpers/expectRevert');
var increaseTime = require('./helpers/increaseTime');

var Token = artifacts.require("./DPRToken.sol");
var Fund = artifacts.require("./funds/FundsRegistry.sol");
var ICO = artifacts.require("./ICO.sol");
var DevFund = artifacts.require("./DevFund.sol");
var TeamFund = artifacts.require("./TeamFund.sol");

const timeout = (delay) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay * 1000);
    });
};

const getRoles = (accounts) => {
    return {
        owners: [accounts[0], accounts[1], accounts[2]],
        creator: accounts[9],
        investor1: accounts[3],
        investor2: accounts[4],
        controller: accounts[5]
    };
};

const initICO = async (accounts, _goal, _cap) => {
    const roles = getRoles(accounts);

    let token = await Token.new(roles.owners, {from: roles.creator});
    const fund = await Fund.new(roles.owners, 2, {from: roles.creator});
    const ico = await ICO.new(roles.owners, 2, fund.address, token.address, 40000, _goal, _cap, {from: roles.creator});

    const devFund = await Fund.new(roles.owners, 2, {from: roles.creator});
    const teamFund = await Fund.new(roles.owners, 2, {from: roles.creator});

    await ico.setFunds(devFund.address, teamFund.address, {from: roles.owners[0]});
    await ico.setFunds(devFund.address, teamFund.address, {from: roles.owners[1]});

    await token.setController(ico.address, {from: roles.owners[0]});
    await token.setController(ico.address, {from: roles.owners[1]});

    await fund.setController(ico.address, {from: roles.owners[0]});
    await fund.setController(ico.address, {from: roles.owners[1]});

    let lastBlock = await web3.eth.getBlock('latest');
    const now = lastBlock.timestamp + 5;
    const stop = now + (90 * 24 * 60 * 60);
    
    await ico.setStartTime(now, { from: roles.owners[0] });
    await ico.setStartTime(now, { from: roles.owners[1] });
    await ico.setStopTime(stop, { from: roles.owners[0] });
    await ico.setStopTime(stop, { from: roles.owners[1] });
    await timeout(5);
    
    return {token, fund, ico, devFund, teamFund};
};

contract('ICO', async (accounts) => {

    it('ICO: Investment', async () => {  
        const roles = getRoles(accounts);   
        const {token, ico, fund} = await initICO(accounts, 1000, 43000000);
        
        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});
        
        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await ico.raisedAmount.call();
        let tokens = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'));
        assert.equal(raisedAmount.toNumber(), 400);
        assert.equal(tokens.toNumber(), (web3.toWei(1, 'ether') * 40000) / 86);

    });

    it('ICO: Check hard cap', async () => {
        const roles = getRoles(accounts);   
        const {token, ico, fund} = await initICO(accounts, 100, 430);
        
        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(2, 'ether')});
        
        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await ico.raisedAmount.call();
        let tokens = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(2, 'ether'));
        assert.equal(raisedAmount.toNumber(), 800);
        assert.equal(tokens.toNumber(), (web3.toWei(2, 'ether') * 40000) / 86);

        await expectRevert(ico.sendTransaction({from: roles.investor1, value: web3.toWei(2, 'ether')}));
        
    });

    it('ICO: Check funds', async () => {
        const roles = getRoles(accounts);   
        const {token, ico, fund, devFund, teamFund} = await initICO(accounts, 1000, 43000000);

        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});
        
        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await ico.raisedAmount.call();
        let tokens = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'));
        assert.equal(raisedAmount.toNumber(), 400);
        assert.equal(tokens.toNumber(), (web3.toWei(1, 'ether') * 40000) / 86);

        
    });

    it('ICO: Check stages', async () => {
        
        const roles = getRoles(accounts);   
        const {token, ico, fund} = await initICO(accounts, 1000, 43000000);

        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await ico.raisedAmount.call();

        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'));
        assert.equal(raisedAmount.toNumber(), 400);
        
        // Increase 14 days
        await increaseTime(14 * 24 * 60 * 60);
        
        await ico.sendTransaction({from: roles.investor2, value: web3.toWei(1, 'ether')});

        balance = await web3.eth.getBalance(fund.address);
        raisedAmount = await ico.raisedAmount.call();

        assert.equal(balance.toNumber(), web3.toWei(2, 'ether'));
        assert.equal(raisedAmount.toNumber(), 800);


        // Increase 31 days 
        await increaseTime(31 * 24 * 60 * 60);

        await ico.sendTransaction({from: roles.creator, value: web3.toWei(1, 'ether')});

        balance = await web3.eth.getBalance(fund.address);
        raisedAmount = await ico.raisedAmount.call();


        assert.equal(balance.toNumber(), web3.toWei(3, 'ether'));
        assert.equal(raisedAmount.toNumber(), 1200);  

        let all_tokens = await token.totalSupply();
        let calc_tokens = BigNumber(1000000000000000000).multiply(40000).div(86)
            .plus(BigNumber(1000000000000000000).multiply(40000).div(88))
            .plus(BigNumber(1000000000000000000).multiply(40000).div(93))
            .toString();
    
        assert.equal(calc_tokens, all_tokens.toString(10));
    });

    it('ICO: Check Finish Crowdsale', async () => {
        const roles = getRoles(accounts);   
        const {token, ico, fund, devFund, teamFund} = await initICO(accounts, 500, 43000000);

        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        await expectRevert(ico.finishCrowdsale({from: roles.investor1}));

        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        // Increase 95 days
        await increaseTime(95 * 24 * 60 * 60);

        await ico.finishMinting({from: roles.owners[0]});
        await ico.finishMinting({from: roles.owners[1]});
        
        let all_tokens = await token.totalSupply();        
        let percent = all_tokens.div(100);
        
        let advisers = await token.balanceOf(fund.address, {from: roles.investor1});
        let team = await token.balanceOf(teamFund.address, {from: roles.investor1});
        let dev = await token.balanceOf(devFund.address, {from: roles.investor1});

        assert.equal(percent.toNumber(), team.div(15).toNumber());
        assert.equal(percent.toNumber(), dev.div(10).toNumber());
        assert.equal(percent.toNumber(), advisers.div(5).toNumber());        
        
    });

    it('ICO: Check withdrawal', async () => {
        const roles = getRoles(accounts);   
        const {token, ico, fund, devFund, teamFund} = await initICO(accounts, 500, 43000000);

        await ico.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        await expectRevert(ico.finishCrowdsale({from: roles.investor1}));


        // Increase 95 days
        await increaseTime(95 * 24 * 60 * 60);
        await ico.finishCrowdsale({from: roles.owners[0]});
        await expectRevert(ico.withdrawPayments({from: roles.owners[0]}));

        let balance = await web3.eth.getBalance(fund.address);
        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'))
        
        await ico.withdrawPayments({from: roles.investor1});
        balance = await web3.eth.getBalance(fund.address);
        assert.equal(balance.toNumber(), 0)
    });
});