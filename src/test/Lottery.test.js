import assert from 'node:assert';
import Web3 from 'web3';
import ganache from 'ganache';
import compiled from '../compile.js';

const {
  abi,
  evm: {
    bytecode: { object },
  },
} = compiled;

const web3 = new Web3(ganache.provider({ logging: { quiet: true } }));

describe('Lottery', () => {
  const MIN_WEI = web3.utils.toWei('0.02', 'ether');

  let lottery;
  let accounts;

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(abi).deploy({ data: object, arguments: [] }).send({ from: accounts[0], gas: '1000000' });
  });

  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('should set the manager address as the deployer', async () => {
    const managerAddress = await lottery.methods.manager().call();
    assert.strictEqual(managerAddress, accounts[0]);
  });

  it('should be able to participate the lottery if at least 0.01 ETH was given', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: MIN_WEI,
    });

    const players = await lottery.methods.getPlayers().call();
    assert.equal(accounts[0], players[0]);
  });

  it('should fail if the player does not send the minimum amount of ETH', async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: '0x1000',
      });
      assert(false);
    } catch (error) {
      assert.ok(error);
    }
  });

  it('should allow many players to participate the lottery', async () => {
    const selectedAccounts = accounts.slice(0, 5);
    await Promise.all(selectedAccounts.map(async (account) => lottery.methods.enter().send({ from: account, value: MIN_WEI })));

    const players = await lottery.methods.getPlayers().call();

    assert.ok(players.length === selectedAccounts.length);
  });

  it('should not be able to pick a winner if the caller is not the manager', async () => {
    try {
      await lottery.methods.pickWinnerAndPay().send({ from: accounts[1] });
      assert(false);
    } catch (error) {
      assert.ok(error);
    }
  });

  it('should be able to pick a winner from the players participating the lottery and pay the resulting ETH', async () => {
    const selectedAccounts = accounts.slice(0, 5);
    await Promise.all(selectedAccounts.map(async (account) => lottery.methods.enter().send({ from: account, value: MIN_WEI })));

    const initialAddressBalanceMap = {};
    for (let i = 0; i < selectedAccounts.length; i++) {
      const balance = await web3.eth.getBalance(selectedAccounts[i]);
      initialAddressBalanceMap[selectedAccounts[i]] = balance;
    }

    const contractBalanceAfterGames = await web3.eth.getBalance(lottery.options.address);
    await lottery.methods.pickWinnerAndPay().send({ from: accounts[0] });

    const finalAddressBalanceMap = {};
    for (let i = 0; i < selectedAccounts.length; i++) {
      const balance = await web3.eth.getBalance(selectedAccounts[i]);
      finalAddressBalanceMap[selectedAccounts[i]] = balance;
    }

    const contractBalanceAfterWinnerPicked = await web3.eth.getBalance(lottery.options.address);
    const winnerAddress = await lottery.methods.winner().call();
    const winnerInitialBalance = initialAddressBalanceMap[winnerAddress];
    const winnerFinalBalance = finalAddressBalanceMap[winnerAddress];

    assert.ok(selectedAccounts.includes(winnerAddress));
    assert.ok(winnerFinalBalance > winnerInitialBalance);
    assert.ok(contractBalanceAfterGames > contractBalanceAfterWinnerPicked);
  });
});
