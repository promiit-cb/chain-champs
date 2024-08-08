// pages/GamesList.tsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from '../styles/GamesList.module.css';

interface Game {
    name: string;
    team1: string;
    team2: string;
    pool1: number;
    pool2: number;
    start_time: string;
    end_time: string;
    betters: string[];
}

const calculateMoneylineOdds = (pool1: number, pool2: number): { moneylineOddsTeam1: number; moneylineOddsTeam2: number } => {
    if (pool1 === 0 && pool2 === 0) {
        return { moneylineOddsTeam1: 0, moneylineOddsTeam2: 0 };
    }
    if (pool1 === 0) {
        return { moneylineOddsTeam1: 0, moneylineOddsTeam2: -100 };
    }
    if (pool2 === 0) {
        return { moneylineOddsTeam1: -100, moneylineOddsTeam2: 0 };
    }

    const decimalOddsTeam1 = (pool1 + pool2) / pool1;
    const decimalOddsTeam2 = (pool1 + pool2) / pool2;

    const moneylineOddsTeam1 = decimalOddsTeam1 >= 2
        ? (decimalOddsTeam1 - 1) * 100
        : -100 / (decimalOddsTeam1 - 1);

    const moneylineOddsTeam2 = decimalOddsTeam2 >= 2
        ? (decimalOddsTeam2 - 1) * 100
        : -100 / (decimalOddsTeam2 - 1);

    return { moneylineOddsTeam1, moneylineOddsTeam2 };
};

const GamesList: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const { address, isConnected } = useAccount();
    const currentTime = new Date();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch('/api/getGamesFromSmartContract');
                const data = await response.json();
                console.log(data)
                setGames(data);
            } catch (error) {
                console.error('Error fetching games:', error);
            }
        };

        fetchGames();
    }, []);

    const userBets = games.filter(game => game.betters.includes(address || ''));
    const otherGames = games.filter(game => !game.betters.includes(address || '') && new Date(game.end_time) > currentTime);
    const finishedGames = games.filter(game => new Date(game.end_time) <= currentTime);

    const renderGameCard = (game: Game, index: number) => {
        const { moneylineOddsTeam1, moneylineOddsTeam2 } = calculateMoneylineOdds(game.pool1, game.pool2);
        const startTime = new Date(game.start_time);
        const endTime = new Date(game.end_time);

        return (
            <div key={index} className={styles.gameCard}>
                <p className={styles.title}>{game.name}</p>
                <p className={styles.poolTitle}>Current Bet Pool</p>
                <div className={styles.betPools}>
                    <div className={styles.pool}>
                        <p>{game.team1}</p>
                        <p>{game.pool1} ETH</p>
                    </div>
                    <div className={styles.pool}>
                        <p>{game.team2}</p>
                        <p>{game.pool2} ETH</p>
                    </div>
                </div>
                <p className={styles.odds}>
                    Odds:
                    <span className={moneylineOddsTeam1 > 0 ? styles.positiveOdds : styles.negativeOdds}>
                        {moneylineOddsTeam1 > 0 ? `+${moneylineOddsTeam1.toFixed(2)}` : moneylineOddsTeam1.toFixed(2)}
                    </span> for {game.team1},
                    <span className={moneylineOddsTeam2 > 0 ? styles.positiveOdds : styles.negativeOdds}>
                        {moneylineOddsTeam2 > 0 ? `+${moneylineOddsTeam2.toFixed(2)}` : moneylineOddsTeam2.toFixed(2)}
                    </span> for {game.team2}
                </p>
                <p className={styles.lockInTime}>Start Time: {startTime.toLocaleString()}</p>
                <p className={styles.lockInTime}>End Time: {endTime.toLocaleString()}</p>
                {currentTime < startTime ? (
                    <div className={styles.betButtonContainer}>
                        <button
                            className={styles.betButton}
                            onClick={() => alert(`Bet on ${game.team1}`)}
                        >
                            Bet on {game.team1}
                        </button>
                        <button
                            className={styles.betButton}
                            onClick={() => alert(`Bet on ${game.team2}`)}
                        >
                            Bet on {game.team2}
                        </button>
                    </div>
                ) : currentTime < endTime ? (
                    <p className={styles.lockedIn}>Bets are locked in</p>
                ) : (
                    <p className={styles.distributed}>Bets have been distributed</p>
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
            {otherGames.length > 0 ? otherGames.map(renderGameCard) : <p>There are no other games currently available.</p>}
            <h2>Finished Games</h2>
            {finishedGames.length > 0 ? finishedGames.map(renderGameCard) : <p>There are no finished games.</p>}
        </div>
    );
};


export default GamesList;
