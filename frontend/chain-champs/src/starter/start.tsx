// createGame.js

const { ethers } = require('ethers');
const fs = require('fs');

// Load the factory ABI from a file
const factoryABI = JSON.parse(fs.readFileSync('../abi/factory.json', 'utf8'));
const games = JSON.parse(fs.readFileSync('../../data/games.json', 'utf8'));

// Replace with your contract's address and Ethereum provider URL
const factoryAddress = '0x558287f3493A0db5a0Bf34CF1BffF4799001703B';
const providerURL = 'https://base-sepolia.g.alchemy.com/v2/6w0m6Qq8BgDakS7i5wyRoFGIktElM1Iy';
const privateKey = '62c90700af53d4e90ca00486b88948718cade2ec6f6e94140a2e2c245d0edebd';

async function main() {
    // Connect to the Ethereum network
    const provider = new ethers.providers.JsonRpcProvider(providerURL);

    // Create a wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create a contract instance
    const contract = new ethers.Contract(factoryAddress, factoryABI, wallet);

    // Call the contract's createGameContract function
    try {
        for (const item of games) {
            const tx = await contract.createGameContract(item.name, item.team1, item.team2);
            console.log('Transaction sent:', tx.hash);

            // Wait for the transaction to be mined
            await tx.wait();
            console.log('Transaction confirmed:', tx.hash);

            // Optionally, you can fetch the deployed game addresses
            const deployedGames = await contract.getDeployedGames();
            console.log('Deployed game contracts:', deployedGames);
        }
        // const tx = await contract.createGameContract(gameName, team1, team2);
        // console.log('Transaction sent:', tx.hash);

        // // Wait for the transaction to be mined
        // await tx.wait();
        // console.log('Transaction confirmed:', tx.hash);

        // // Optionally, you can fetch the deployed game addresses
        // const deployedGames = await contract.getDeployedGames();
        // console.log('Deployed game contracts:', deployedGames);
    } catch (error) {
        console.error('Error calling contract');
    }
}

main();
