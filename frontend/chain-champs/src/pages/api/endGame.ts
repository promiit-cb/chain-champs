import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';

// Replace these with your actual values
const providerURL = 'https://base-sepolia.g.alchemy.com/v2/6w0m6Qq8BgDakS7i5wyRoFGIktElM1Iy';
const privateKey = '62c90700af53d4e90ca00486b88948718cade2ec6f6e94140a2e2c245d0edebd';
import gameABI from '../../abi/game.json'

async function endGame(gameContractAddress: string, winningTeamName: string) {
    console.log("Trying to end game for " + gameContractAddress + " winning team " + winningTeamName);
    // Create a provider
    const provider = new ethers.providers.JsonRpcProvider(providerURL);

    // Create a wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create a contract instance
    const contract = new ethers.Contract(gameContractAddress, gameABI, wallet);

    try {
        const tx = await contract.endGame(winningTeamName);
        console.log('Game ended for:', gameContractAddress);

        // Wait for the transaction to be mined
        await tx.wait();
        console.log('Transaction confirmed:', tx.hash);
    } catch (error) {
        console.error('Error calling contract for: ' + gameContractAddress);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { gameAddress, winningTeamName } = req.query;

        if (typeof gameAddress === 'string' && typeof winningTeamName === 'string') {
            await endGame(gameAddress, winningTeamName);
            res.status(200).json({ message: `Ending game ${gameAddress} for team ${winningTeamName}` });
        } else {
            res.status(400).json({ message: 'Invalid query parameters' });
        }
    } catch (error) {
        console.error('Error ending game for ' + req.query.gameAddress);
        res.status(500).send('Error ending game');
    }
}