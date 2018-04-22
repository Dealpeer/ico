var Token = artifacts.require("./DPTToken.sol");
var DevFund = artifacts.require("./DevFund.sol");
var expectRevert = require('./helpers/expectRevert');
var increaseTime = require('./helpers/increaseTime');

contract('Dev Fund', function(accounts) {
    let token;
    const owners = [accounts[0], accounts[1], accounts[2]];
    const creator = accounts[9];
    const investor1 = accounts[3];
    const investor2 = accounts[4];
    const controller = accounts[5];

    const initial = async () => {
        let token = await Token.new(owners, {from: creator});
        let devFund = await DevFund.new(owners, 2, {from: creator});
        
        await token.setController(controller, {from: owners[0]});
        await token.setController(controller, {from: owners[1]});

        await devFund.setController(controller, {from: owners[0]});
        await devFund.setController(controller, {from: owners[1]});

        await devFund.setToken(token.address, {from: controller});

        return {token, devFund};
    };

    it("Check 271 day", async () => {
        

        const {token, devFund} = await initial();

        await token.mint(devFund.address, 1000, {from: controller});
        await token.unpause({from: owners[0]});
        await token.unpause({from: owners[1]});

        await devFund.setToken(token.address, {from: controller});

        let lastBlock = await web3.eth.getBlock('latest');
        const now = lastBlock.timestamp;
        await devFund.setTime(now, {from: controller});
        
        let balance = await token.balanceOf(devFund.address, {from: controller});
        assert.equal(balance.toNumber(), 1000);

        await expectRevert(devFund.sendToken(owners[0], 1000, {from: owners[0]}));
        await expectRevert(devFund.sendToken(owners[0], 1000, {from: owners[1]}));

        // Increase 271 days
        await increaseTime(271 * 24 * 60 * 60);

        await devFund.sendToken(owners[0], 200, {from: owners[0]})
        await devFund.sendToken(owners[0], 200, {from: owners[1]})

        await devFund.sendToken(owners[0], 300, {from: owners[0]})
        await devFund.sendToken(owners[0], 300, {from: owners[1]})

        await expectRevert(devFund.sendToken(owners[0], 100, {from: owners[0]}));
        await expectRevert(devFund.sendToken(owners[0], 100, {from: owners[1]}));

        balance = await token.balanceOf(devFund.address, {from: controller});
        assert.equal(balance.toNumber(), 500);

        balance = await token.balanceOf(owners[0], {from: controller});
        assert.equal(balance.toNumber(), 500);


    });

    it("Check 451 day", async () => {
        
        
        const {token, devFund} = await initial();

        await token.mint(devFund.address, 1000, {from: controller});
        await token.unpause({from: owners[0]});
        await token.unpause({from: owners[1]});

        await devFund.setToken(token.address, {from: controller});

        let lastBlock = await web3.eth.getBlock('latest');
        const now = lastBlock.timestamp;
        await devFund.setTime(now, {from: controller});
        
        let balance = await token.balanceOf(devFund.address, {from: controller});
        assert.equal(balance.toNumber(), 1000);

        
        // Increase 451 days
        await increaseTime(451 * 24 * 60 * 60);

        await devFund.sendToken(owners[0], 1000, {from: owners[0]})
        await devFund.sendToken(owners[0], 1000, {from: owners[1]})

        
        balance = await token.balanceOf(devFund.address, {from: controller});
        assert.equal(balance.toNumber(), 0);

        balance = await token.balanceOf(owners[0], {from: controller});
        assert.equal(balance.toNumber(), 1000);

    });
    
});