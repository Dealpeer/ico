
module.exports = async (promise) => {
	try {
		await promise;
		assert.fail('should have revert before');
	} catch(error) {
		assert.isAbove(error.message.search('revert'), -1, 'Expected revert');
	}
};