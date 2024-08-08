import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';

// Replace these with your actual values
const providerURL = 'https://base-sepolia.g.alchemy.com/v2/6w0m6Qq8BgDakS7i5wyRoFGIktElM1Iy';
const privateKey = '62c90700af53d4e90ca00486b88948718cade2ec6f6e94140a2e2c245d0edebd';
import gameABI from '../../abi/game.json'

async function lockContract(gameContractAddress: string) {
    // Create a provider
    const provider = new ethers.providers.JsonRpcProvider(providerURL);

    // Create a wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create a contract instance
    const contract = new ethers.Contract(gameContractAddress, gameABI, wallet);

    try {
        const tx = await contract.lockBetting();
        console.log('Contract locked for:', gameContractAddress);

        // Wait for the transaction to be mined
        await tx.wait();
        console.log('Transaction confirmed:', tx.hash);
    } catch (error) {
        console.error('Error locking contract: ' + gameContractAddress);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { gameAddress } = req.query;
        await lockContract(gameAddress as string);
        res.status(200).json({ message: 'Locking contract' });
    } catch (error) {
        console.error('Error locking contract: ' + req.query.gameAddress);
        res.status(500).send('Error locking contract');
    }
}