var Fund = artifacts.require("./funds/FundsRegistry.sol");
var Token = artifacts.require("./DPRToken.sol");
contract('FundRegistry', function(accounts) {

    let fund;
    let token;
    const owners = [accounts[0], accounts[1], accounts[2]];
    const creator = accounts[9];
    const investor1 = accounts[3];
    const investor2 = accounts[4];
    const controller = accounts[5];

    it('Init', async () => {
        fund = await Fund.new(owners, 2);
        return fund;
    });
    it('Set controller', async () => {
        await fund.setController(controller, {from: owners[0]});
        await fund.setController(controller, {from: owners[1]});
    });

    it('Fallback', async () => {
        await fund.send(web3.toWei(1, 'ether'), {from: investor1});

        let balance = await web3.eth.getBalance(fund.address);
        assert.equal(balance.toNumber(), web3.toWei(1, 'ether'));
    });

    it('Deposit', async () => {
        await fund.deposit(investor1, {from: controller, value: web3.toWei(1, 'ether')});

        let balance = await web3.eth.getBalance(fund.address);
        assert.equal(balance.toNumber(), web3.toWei(2, 'ether'));
    });

    it('Change state', async () => {
        await fund.changeState(1, {from: controller});
    });

    it('Withdraw Payments', async () => {
        let balanceBefore = await web3.eth.getBalance(investor1);

        await fund.withdrawPayments(investor1, {from: controller});
        
        let balanceAfter = await web3.eth.getBalance(investor1);
        assert.equal(balanceBefore.toNumber(), balanceAfter.toNumber() - web3.toWei(1, 'ether'));

    });

    it('Send Ether', async () => {
        let balanceBefore = await web3.eth.getBalance(controller);

        await fund.sendEther(controller, web3.toWei(1, 'ether'), {from: owners[0]});
        await fund.sendEther(controller, web3.toWei(1, 'ether'), {from: owners[1]});

        let balanceAfter = await web3.eth.getBalance(controller);
        assert.equal(balanceBefore.toNumber(), balanceAfter.toNumber() - web3.toWei(1, 'ether'));
    });

    it('Set Token', async () => {
        token = await Token.new(owners, {from: creator});
        await fund.setToken(token.address, {from: controller});

        await token.setController(controller, {from: owners[0]});
        await token.setController(controller, {from: owners[1]});

        await token.mint(fund.address, web3.toWei(1, 'ether'), {from: controller});

        await token.unpause({from: owners[0]});
        await token.unpause({from: owners[1]});
    });

    it('Send Token', async () => {

        let balanceBefore = await token.balanceOf(controller, {from: investor1});
        await fund.sendToken(controller, web3.toWei(1, 'ether'), {from: owners[0]});
        await fund.sendToken(controller, web3.toWei(1, 'ether'), {from: owners[1]});
        let balanceAfter = await token.balanceOf(controller, {from: investor1});

        assert.equal(balanceBefore.toNumber(), balanceAfter.toNumber() - web3.toWei(1, 'ether'));
    });

});