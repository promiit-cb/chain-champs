// pages/GamesList.tsx
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useAccount, useConnect, useWriteContract } from 'wagmi';
import styles from '../styles/GamesList.module.css';
import gameABI from '../abi/game.json'
import { config } from '../wagmi';

interface Game {
    gameAddress: `0x${string}`;
    name: string;
    team1: string;
    team2: string;
    pool1: number;
    pool2: number;
    start_time: string;
    end_time: string;
    betters: string[];
}


// const calculateMoneylineOdds = (pool1: number, pool2: number): { moneylineOddsTeam1: number; moneylineOddsTeam2: number } => {
//     if (pool1 === 0 && pool2 === 0) {
//         return { moneylineOddsTeam1: 0, moneylineOddsTeam2: 0 };
//     }
//     if (pool1 === 0) {
//         return { moneylineOddsTeam1: 0, moneylineOddsTeam2: -100 };
//     }
//     if (pool2 === 0) {
//         return { moneylineOddsTeam1: -100, moneylineOddsTeam2: 0 };
//     }

//     const decimalOddsTeam1 = (pool1 + pool2) / pool1;
//     const decimalOddsTeam2 = (pool1 + pool2) / pool2;

//     const moneylineOddsTeam1 = decimalOddsTeam1 >= 2
//         ? (decimalOddsTeam1 - 1) * 100
//         : -100 / (decimalOddsTeam1 - 1);

//     const moneylineOddsTeam2 = decimalOddsTeam2 >= 2
//         ? (decimalOddsTeam2 - 1) * 100
//         : -100 / (decimalOddsTeam2 - 1);

//     return { moneylineOddsTeam1, moneylineOddsTeam2 };
// };

const GamesList: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [gameLockState, setGameLockState] = useState<Map<string, boolean>>(new Map());
    const [gameDistributeState, setGameDistributeState] = useState<Map<string, boolean>>(new Map());
    const { address, isConnected } = useAccount();

    const [currentTime, setCurrentTime] = useState(new Date());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { writeContract } = useWriteContract()

    const handleBet = async (gameAddress: `0x${string}`, teamName: string) => {
        const amount = prompt(`Enter the amount of you want to bet on ${teamName}:`);
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert('Invalid amount entered.');
            return;
        }

        const parsedAmount = ethers.utils.parseEther(amount);
        console.log("parsedAmount", parsedAmount);

        try {
            writeContract({
                address: gameAddress,
                abi: gameABI,
                functionName: 'deposit',
                args: [teamName],
                value: parsedAmount.toBigInt(),
            });
        } catch (error) {
            console.error('Error placing bet for game: ' + gameAddress);
            alert('Failed to place bet');
        }

    };
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch('/api/getGamesFromSmartContract');
                const data = await response.json();
                console.log(data)
                setGames(data);
            } catch (error) {
                console.error('Error fetching games');
            }
        };

        fetchGames();
    }, []);

    const userBets = games.filter(game => game.betters.includes(address || ''));
    const upcomingGames = games.filter(game => new Date(game.start_time) > currentTime);
    const inProgressGames = games.filter(game => new Date(game.start_time) <= currentTime && new Date(game.end_time) > currentTime);
    const finishedGames = games.filter(game => new Date(game.end_time) <= currentTime);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // let gamesState = new Map<string, [boolean, boolean]>(); // [isLocked, isDistributed]
        // for (const game of games) {
        //     gamesState.set(game.name, [false, false]);
        // }


        intervalRef.current = setInterval(() => {
            console.log("GAME STATE MAP:")
            console.log(...gameLockState.entries());
            console.log(...gameDistributeState.entries());

            const newCurrentTime = new Date();
            for (const game of games) {
                if (new Date(game.start_time) < currentTime) {
                    // Call lock function
                    console.log(gameLockState.get(game.name))
                    if (!gameLockState.get(game.name)) {
                        console.log("NOT LOCKED YET FOR " + game.name);
                        const lockContract = async () => {
                            try {
                                console.log("LOCKING CONTRACT for " + game.name);
                                const response = await fetch(`/api/lockContract?gameAddress=${game.gameAddress}`);
                                const data = await response.json();
                                console.log(data)
                                setGameLockState(prevState => new Map(prevState).set(game.name, true));
                                // gamesState.set(game.name, [true, gamesState.get(game.name)![1]]);
                            } catch (error) {
                                console.error('Error locking contract for ' + game.name);
                            }
                        };
                        lockContract();
                    }
                }
                if (currentTime > new Date(game.end_time)) {
                    // Call endGame function
                    if (!gameDistributeState.get(game.name)) {
                        console.log("NOT DISTRIBUTED YET + " + game.name);
                        const endGame = async () => {
                            try {
                                console.log("ENDING GAME for " + game.name);
                                const response = await fetch(`/api/endGame?gameAddress=${game.gameAddress}&winningTeamName=${game.team1}`);
                                const data = await response.json();
                                console.log(data)
                                setGameDistributeState(prevState => new Map(prevState).set(game.name, true));
                                // gamesState.set(game.name, [gamesState.get(game.name)![0], true]);
                            } catch (error) {
                                console.error('Error locking contract for ' + game.name);
                            }
                        };
                        endGame();
                    }
                }
            }
            setCurrentTime(newCurrentTime);
        }, 5000);
    }, [setCurrentTime]);

    const renderGameCard = (game: Game, index: number) => {
        //const { moneylineOddsTeam1, moneylineOddsTeam2 } = calculateMoneylineOdds(game.pool1, game.pool2);
        const startTime = new Date(game.start_time);
        const endTime = new Date(game.end_time);
        const userBet = game.betters.find(better => better === address);

        return (
            <div key={index} className={styles.gameCard}>
                <p className={styles.title}>{game.name}</p>
                <p className={styles.poolTitle}>Current Bet Pool</p>
                <div className={styles.betPools}>
                    <div className={styles.pool}>
                        <p>{game.team1}</p>
                        <p>{ethers.utils.formatEther(game.pool1)} ETH</p>
                    </div>
                    <div className={styles.pool}>
                        <p>{game.team2}</p>
                        <p>{ethers.utils.formatEther(game.pool2)} ETH</p>
                    </div>
                </div>
                {/* <p className={styles.odds}>
                    Odds:
                    <span className={moneylineOddsTeam1 > 0 ? styles.positiveOdds : styles.negativeOdds}>
                        {moneylineOddsTeam1 > 0 ? `+${moneylineOddsTeam1.toFixed(2)}` : moneylineOddsTeam1.toFixed(2)}
                    </span> for {game.team1},
                    <span className={moneylineOddsTeam2 > 0 ? styles.positiveOdds : styles.negativeOdds}>
                        {moneylineOddsTeam2 > 0 ? `+${moneylineOddsTeam2.toFixed(2)}` : moneylineOddsTeam2.toFixed(2)}
                    </span> for {game.team2}
                </p> */}
                <p className={styles.lockInTime}>Start Time: {startTime.toLocaleString()}</p>
                <p className={styles.lockInTime}>End Time: {endTime.toLocaleString()}</p>
                {currentTime >= endTime ? (
                    <p className={styles.distributed}>Bets have been distributed</p>
                ) : currentTime >= startTime ? (
                    <p className={styles.lockedIn}>Bets are locked in</p>
                ) : userBet ? (
                    <p className={styles.alreadyBet}>You already bet on this game</p>
                ) : (
                    <div className={styles.betButtonContainer}>
                        <button
                            className={styles.betButton}
                            onClick={() => handleBet(game.gameAddress, game.team1)}
                        >
                            Bet on {game.team1}
                        </button>
                        <button
                            className={styles.betButton}
                            onClick={() => handleBet(game.gameAddress, game.team2)}
                        >
                            Bet on {game.team2}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.gamesList}>
            {isConnected && (
                <>
                    <h2>Your Bets</h2>
                    {userBets.length > 0 ? userBets.map(renderGameCard) : <p>You have no bets yet.</p>}
                </>
            )}
            <h2>Upcoming Games</h2>
            {upcomingGames.length > 0 ? upcomingGames.map(renderGameCard) : <p>There are no upcoming games currently available.</p>}
            <h2>Games in Progress</h2>
            {inProgressGames.length > 0 ? inProgressGames.map(renderGameCard) : <p>There are no games in progress currently available.</p>}
            <h2>Finished Games</h2>
            {finishedGames.length > 0 ? finishedGames.map(renderGameCard) : <p>There are no finished games.</p>}
        </div>
    );
};


export default GamesList;
