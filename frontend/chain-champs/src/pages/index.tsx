// pages/index.js
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import GamesList from './GamesList'; // Import from the same directory
import styles from '../styles/Home.module.css';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className={styles.container}>
      <Head>
        <title>ChainChamps</title>
        <meta name="description" content="A blockchain-based betting app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>ChainChamps</h1>
        <ConnectButton />
        {isConnected ? (
          <GamesList />
        ) : (
          <p>Please connect your wallet to see the games.</p>
          // TODO: Add instructions and about section here
        )}
      </main>
    </div>
  );
}
