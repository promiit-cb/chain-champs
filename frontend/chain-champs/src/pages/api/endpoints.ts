// TODO: Delete this file?
// pages/api/games.js
import { ethers } from 'ethers';

// Replace these with your contract addresses and ABIs
const gameFactoryAddress = '0xYourFactoryAddressHere';
const gameFactoryABI = [
    // Your game factory ABI here
];
const gameABI = [
    // Your game contract ABI here
];

const dummyLockInDates = {
    '0xGameContractAddress1': '2024-08-10T12:00:00Z',
    '0xGameContractAddress2': '2024-08-11T14:00:00Z',
    // Add more game contract addresses and their lock-in dates here
};

const provider = new ethers.providers.JsonRpcProvider('https://your-eth-node-url'); // Replace with your provider URL

async function getGameContracts() {
    const contract = new ethers.Contract(gameFactoryAddress, gameFactoryABI, provider);
    return await contract.getGameContracts();
}

async function getBetPools(gameAddress) {
    const contract = new ethers.Contract(gameAddress, gameABI, provider);
    const team1 = await contract.team1();
    const team2 = await contract.team2();
    const pool1 = await contract.getPool(team1);
    const pool2 = await contract.getPool(team2);
    return { team1, team2, pool1, pool2, lockInDate: dummyLockInDates[gameAddress] };
}

export default async function handler(req, res) {
    try {
        const gameAddresses = await getGameContracts();
        const games = await Promise.all(gameAddresses.map(async (address) => {
            const pools = await getBetPools(address);
            return { address, ...pools };
        }));
        res.status(200).json(games);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching game contracts');
    }
}
