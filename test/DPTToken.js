var Token = artifacts.require("./DPTToken.sol");

contract('DPT Token', function(accounts) {
    let token;
    const owners = [accounts[0], accounts[1], accounts[2]];
    const creator = accounts[9];
    const investor1 = accounts[3];
    const investor2 = accounts[4];
    const controller = accounts[5];

    it("Init token", async () => {
        token = await Token.new(owners, {from: creator});
    });
    it('Set controller', async () => {
        await token.setController(controller, {from: owners[0]});
        await token.setController(controller, {from: owners[1]});
    });
    it('Mint token', async () => {
        await token.mint(investor1, web3.toWei(15, 'ether'), {from: controller});
        await token.mint(investor2, web3.toWei(30, 'ether'), {from: controller});
        await token.finishMinting({from: controller});

        assert.equal(await token.balanceOf(investor1, {from: creator}), web3.toWei(15, 'ether'));
        assert.equal(await token.balanceOf(investor2, {from: creator}), web3.toWei(30, 'ether'));
    });
    it('Start circulation', async () => {
        await token.unpause({from: owners[0]});
        await token.unpause({from: owners[1]});
    });
    it('Transfer token', async () => {
        token.transfer(investor2, web3.toWei(5, 'ether'), {from: investor1});

        let balance1 = await token.balanceOf(investor1, {from: investor1});
        let balance2 = await token.balanceOf(investor2, {from: investor2});
            
        assert.equal(await web3.fromWei(balance1.toNumber(), "ether" ), 10);
        assert.equal(await web3.fromWei(balance2.toNumber(), "ether" ), 35);
    });
});