// pages/api/games.ts
import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import factoryABI from '../../abi/factory.json'
import gameABI from '../../abi/game.json'
import gameData from '../../../data/games.json'


// Replace with your contract's address and Ethereum provider URL
// const factoryAddress = '0x558287f3493A0db5a0Bf34CF1BffF4799001703B';
const factoryAddress = '0x3bA32a9b334709AF5b6322A13fa07602312DfECE'
const providerURL = 'https://base-sepolia.g.alchemy.com/v2/6w0m6Qq8BgDakS7i5wyRoFGIktElM1Iy';

const provider = new ethers.providers.JsonRpcProvider(providerURL); // Replace with your provider URL

async function getDeployedGames() {
    const contract = new ethers.Contract(factoryAddress, factoryABI, provider);
    return await contract.getDeployedGames();
}

async function getGameDetails(gameAddress: string) {
    const contract = new ethers.Contract(gameAddress, gameABI, provider);
    const team1 = await contract.team1();
    const team2 = await contract.team2();
    const pool1 = (await contract.team1Pool()).toString();
    const pool2 = (await contract.team2Pool()).toString();
    const betters = await contract.getBalances();
    // Find the start and end times from the JSON file
    // Find the start and end times from the JSON file
    const nameOfGame = team1 + " vs " + team2
    const gameTimes = gameData.find((game: { name: string }) => game.name === nameOfGame);
    const startTime = gameTimes?.start_time || "Unable to find start time";
    const endTime = gameTimes?.end_time || "Unable to find end time";
    return {
        gameAddress,
        team1,
        team2,
        pool1,
        pool2,
        startTime,
        endTime,
        betters,
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const gameAddresses = await getDeployedGames();
        const games = await Promise.all(gameAddresses.map(async (address: string) => {
            const details = await getGameDetails(address);
            return {
                gameAddress: details.gameAddress,
                name: `${details.team1} vs ${details.team2}`,
                team1: details.team1,
                team2: details.team2,
                pool1: details.pool1,
                pool2: details.pool2,
                start_time: details.startTime,
                end_time: details.endTime,
                betters: details.betters,
            };
        }));

        res.status(200).json(games);
    } catch (error) {
        console.error('Error fetching game contracts');
        res.status(500).send('Error fetching game contracts');
    }
}
