var Token = artifacts.require("./DPRToken.sol");
var TeamFund = artifacts.require("./TeamFund.sol");
var expectRevert = require('./helpers/expectRevert');
var increaseTime = require('./helpers/increaseTime');

contract('Team Fund', function(accounts) {
    let token;
    const owners = [accounts[0], accounts[1], accounts[2]];
    const creator = accounts[9];
    const investor1 = accounts[3];
    const investor2 = accounts[4];
    const controller = accounts[5];

    const initial = async () => {
        let token = await Token.new(owners, {from: creator});
        let teamFund = await TeamFund.new(owners, 2, {from: creator});
        
        await token.setController(controller, {from: owners[0]});
        await token.setController(controller, {from: owners[1]});

        await teamFund.setController(controller, {from: owners[0]});
        await teamFund.setController(controller, {from: owners[1]});

        await teamFund.setToken(token.address, {from: controller});

        return {token, teamFund};
    };

    it("Check 181 day", async () => {
        
        const {token, teamFund} = await initial();

        await token.mint(teamFund.address, 1000, {from: controller});
        await token.unpause({from: owners[0]});
        await token.unpause({from: owners[1]});

        await teamFund.setToken(token.address, {from: controller});

        let lastBlock = await web3.eth.getBlock('latest');
        const now = lastBlock.timestamp;
        await teamFund.setTime(now, {from: controller});
        
        let balance = await token.balanceOf(teamFund.address, {from: controller});
        assert.equal(balance.toNumber(), 1000);

        await expectRevert(teamFund.sendToken(owners[0], 1000, {from: owners[0]}));
        await expectRevert(teamFund.sendToken(owners[0], 1000, {from: owners[1]}));

        // Increase 181 days
        await increaseTime(181 * 24 * 60 * 60);

        await teamFund.sendToken(owners[0], 200, {from: owners[0]})
        await teamFund.sendToken(owners[0], 200, {from: owners[1]})

        await teamFund.sendToken(owners[0], 300, {from: owners[0]})
        await teamFund.sendToken(owners[0], 300, {from: owners[1]})

        await expectRevert(teamFund.sendToken(owners[0], 100, {from: owners[0]}));
        await expectRevert(teamFund.sendToken(owners[0], 100, {from: owners[1]}));

        balance = await token.balanceOf(teamFund.address, {from: controller});
        assert.equal(balance.toNumber(), 500);

        balance = await token.balanceOf(owners[0], {from: controller});
        assert.equal(balance.toNumber(), 500);
    });

    it("Check 365 day", async () => {
        
        const {token, teamFund} = await initial();

        await token.mint(teamFund.address, 1000, {from: controller});
        await token.unpause({from: owners[0]});
        await token.unpause({from: owners[1]});

        await teamFund.setToken(token.address, {from: controller});

        let lastBlock = await web3.eth.getBlock('latest');
        const now = lastBlock.timestamp;
        await teamFund.setTime(now, {from: controller});
        
        let balance = await token.balanceOf(teamFund.address, {from: controller});
        assert.equal(balance.toNumber(), 1000);

        
        // Increase 365 days
        await increaseTime(365 * 24 * 60 * 60);

        await teamFund.sendToken(owners[0], 1000, {from: owners[0]})
        await teamFund.sendToken(owners[0], 1000, {from: owners[1]})

        
        balance = await token.balanceOf(teamFund.address, {from: controller});
        assert.equal(balance.toNumber(), 0);

        balance = await token.balanceOf(owners[0], {from: controller});
        assert.equal(balance.toNumber(), 1000);

    });
    
});