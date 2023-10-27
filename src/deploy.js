import HDWalletProvider from '@truffle/hdwallet-provider';
import { Web3 } from 'web3';
import compiled from './compile.js';

const { abi, evm } = compiled;

const provider = new HDWalletProvider(process.env.ACCOUNTS_MNEMONIC, process.env.NETWORK_DEPLOY_ENDPOINT);

const web3 = new Web3(provider);

const accounts = await web3.eth.getAccounts();
console.log('Deploying from account', accounts[0]);

const result = await new web3.eth.Contract(abi)
  .deploy({ data: evm.bytecode.object, arguments: [] })
  .send({ from: accounts[0], gas: '1000000' });

console.log('Contract deployed to', result.options.address);
provider.engine.stop();
