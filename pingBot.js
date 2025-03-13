const httpNode = require('node:http');
const { createPublicClient, http, getContract, createWalletClient } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { sepolia } = require ('viem/chains')
const  dotenv  = require ('dotenv')

const server = httpNode.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Ping bot is working well!\n');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
  pingpong();
});

dotenv.config();
const privateKey = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(privateKey);
const wallet = createWalletClient({
  account,
  chain: sepolia,
  transport: http()
});
const client = createPublicClient({ 
  chain: sepolia, 
  transport: http(), 
});

const contractAddress = '0xF43147eF2f15615dDFCf5bf4e8a6a3327EC4a193';//'0xa7f42ff7433cb268dd7d59be62b00c30ded28d3d';
const contractAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,
    "inputs":[{"indexed":false,"internalType":"address","name":"pinger","type":"address"}],"name":"NewPinger","type":"event"},
    {"anonymous":false,"inputs":[],"name":"Ping","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"}],
    "name":"Pong","type":"event"},{"inputs":[{"internalType":"address","name":"_pinger","type":"address"}],
    "name":"changePinger","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"ping","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"pinger","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"bytes32","name":"_txHash","type":"bytes32"}],"name":"pong","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const contract = getContract({
  address: contractAddress,
  abi : contractAbi,
  client
});

let currentBlockNumber = 7890000n;

const pingpong = () => {
  console.log("ping pong bot launched from block number : " + currentBlockNumber);
  const unwatch = contract.watchEvent.Ping({
    fromBlock: currentBlockNumber,
    onLogs: async(logs) => {
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        console.log(log);
        try{
          await wallet.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'pong',
            args: [log.transactionHash]
          });
          console.log("pong send");
          currentBlockNumber = log.blockNumber + 1n;
        }catch(error){
          console.error(error);
          unwatch();
          setTimeout(() => {
            pinpong();
          }, 5000);
          break;
        }
      }
    }
  });
}