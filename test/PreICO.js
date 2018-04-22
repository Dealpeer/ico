'use strict';
var moment = require('moment');
var expectRevert = require('./helpers/expectRevert');
var increaseTime = require('./helpers/increaseTime');

var Token = artifacts.require("./DPTToken.sol");
var Fund = artifacts.require("./funds/FundsRegistry.sol");
var PreICO = artifacts.require("./PreICO.sol");

const timeout = (delay) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay * 1000);
    });
};

function waitEvent(event, needStop) {
    return new Promise((resolve, reject) => {
        event.watch(function(error, result){
            if (needStop)
                event.stopWatching();
            if (error)
                return reject(error);

            console.log(result.args);
            resolve(result);
        });
    });
}

const getRoles = (accounts) => {
    return {
        owners: [accounts[0], accounts[1], accounts[2]],
        creator: accounts[9],
        investor1: accounts[3],
        investor2: accounts[4],
        controller: accounts[5]
    };
};

const initPreICO = async (accounts, _cap) => {
    const roles = getRoles(accounts);

    let token = await Token.new(roles.owners, {from: roles.creator});
    const fund = await Fund.new(roles.owners, 2, {from: roles.creator});
    const preICO = await PreICO.new(roles.owners, 2, fund.address, token.address, 40000, _cap, {from: roles.creator});

    await token.setController(preICO.address, {from: roles.owners[0]});
    await token.setController(preICO.address, {from: roles.owners[1]});

    await fund.setController(preICO.address, {from: roles.owners[0]});
    await fund.setController(preICO.address, {from: roles.owners[1]});

    let lastBlock = await web3.eth.getBlock('latest');
    const now = lastBlock.timestamp + 5;
    const stop = now + (61 * 24 * 60 * 60);
    
    await preICO.setStartTime(now, { from: roles.owners[0] });
    await preICO.setStartTime(now, { from: roles.owners[1] });
    await preICO.setStopTime(stop, { from: roles.owners[0] });
    await preICO.setStopTime(stop, { from: roles.owners[1] });
    await timeout(5);

    //await preICO.updateEthPrice({from: roles.creator, value: web3.toWei(1, 'ether')});
    //let event = await preICO.NewETHPrice({_from: roles.creator},{fromBlock: 0, toBlock: 'latest'});
    //await waitEvent(event);
    //let price = await preICO.PriceInCents.call();
    //assert.isBelow(0, price.toNumber());
    
    return {token, fund, preICO};
};

contract('Pre ICO', async (accounts) => {

    it('PreICO: Investment', async () => {  
        const roles = getRoles(accounts);   
        const {token, preICO, fund} = await initPreICO(accounts, 43000000);
        
        await preICO.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});
        
        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await preICO.raisedAmount.call();
        let tokens = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'));
        assert.equal(raisedAmount.toNumber(), 400);
        assert.equal(tokens.toNumber(), (web3.toWei(1, 'ether') * 40000) / 55);

    });

    it('PreICO: Check hard cap', async () => {
        const roles = getRoles(accounts);   
        const {token, preICO, fund} = await initPreICO(accounts, 430);
        
        await preICO.sendTransaction({from: roles.investor1, value: web3.toWei(2, 'ether')});
        
        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await preICO.raisedAmount.call();
        let tokens = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(2, 'ether'));
        assert.equal(raisedAmount.toNumber(), 800);
        assert.equal(tokens.toNumber(), (web3.toWei(2, 'ether') * 40000) / 55);

        await expectRevert(preICO.sendTransaction({from: roles.investor1, value: web3.toWei(2, 'ether')}));
        
    });

    it('PreICO: Check funds', async () => {
        const roles = getRoles(accounts);   
        const {token, preICO, fund} = await initPreICO(accounts, 430);
        
        await preICO.sendTransaction({from: roles.investor1, value: web3.toWei(2, 'ether')});
        
        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await preICO.raisedAmount.call();
        let tokens = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(2, 'ether'));
        assert.equal(raisedAmount.toNumber(), 800);
        assert.equal(tokens.toNumber(), (web3.toWei(2, 'ether') * 40000) / 55);
    });

    it('PreICO: Check stages', async () => {
        
        const roles = getRoles(accounts);   
        const {token, preICO, fund} = await initPreICO(accounts, 43000000);

        await preICO.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        let balance = await web3.eth.getBalance(fund.address);
        let raisedAmount = await preICO.raisedAmount.call();
        let tokens_stage1 = await token.balanceOf(roles.investor1, {from: roles.investor1});


        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'));
        assert.equal(raisedAmount.toNumber(), 400);
        assert.equal(tokens_stage1.toNumber(), (web3.toWei(1, 'ether') * 40000) / 55);

        // Increase 15 days to stage 2
        await increaseTime(15 * 24 * 60 * 60);
        
        await preICO.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        balance = await web3.eth.getBalance(fund.address);
        raisedAmount = await preICO.raisedAmount.call();
        let tokens_stage2 = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(2, 'ether'));
        assert.equal(raisedAmount.toNumber(), 800);
        assert.equal(tokens_stage2.toNumber(), parseInt(tokens_stage1.toNumber()) + (web3.toWei(1, 'ether') * 40000) / 60);


        // Increase 15 days to stage 3
        await increaseTime(15 * 24 * 60 * 60);

        await preICO.sendTransaction({from: roles.investor1, value: web3.toWei(1, 'ether')});

        balance = await web3.eth.getBalance(fund.address);
        raisedAmount = await preICO.raisedAmount.call();
        let tokens_stage3 = await token.balanceOf(roles.investor1, {from: roles.investor1});

        assert.equal(balance.toNumber(), web3.toWei(3, 'ether'));
        assert.equal(raisedAmount.toNumber(), 1200);        
        assert.equal(tokens_stage3.toNumber(), (tokens_stage2.toNumber() + ((web3.toWei(1, 'ether') * 40000) / 65)));

    });
});