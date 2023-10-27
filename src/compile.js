import path from 'node:path';
import fs from 'node:fs';
import solc from 'solc';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const inboxPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const source = fs.readFileSync(inboxPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'Lottery.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

/**
 * @type {{
 *  contracts: {
 *   'Lottery.sol': {
 *      Inbox: {
 *        abi: any;
 *        evm: {
 *        bytecode: {
 *        object: string;
 *          };
 *        };
 *      };
 *    };
 *  };
 * }}
 */
const parsed = JSON.parse(solc.compile(JSON.stringify(input)));

export default parsed.contracts['Lottery.sol'].Lottery;
