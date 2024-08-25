import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';  // Import ethers correctly
import { contractABI, contractAddress } from './config';
import './App.css';

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState('Heads');
  const [status, setStatus] = useState('');
  const [contractBalance, setContractBalance] = useState('0');

  // Check if wallet is connected
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log('Make sure you have MetaMask installed!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
        getContractBalance();
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
      getContractBalance();
    } catch (error) {
      console.log(error);
    }
  };

  // Get contract balance
  const getContractBalance = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);  // Use ethers.BrowserProvider
        const signer = provider.getSigner();
        const coinFlipContract = new ethers.Contract(contractAddress, contractABI, signer);
        const balance = await provider.getBalance(contractAddress);
        setContractBalance(ethers.formatEther(balance));  // Use ethers.formatEther instead of ethers.utils.formatEther
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Flip coin
  const flipCoin = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        if (!betAmount || isNaN(betAmount) || Number(betAmount) <= 0) {
          alert('Please enter a valid bet amount in ETH');
          return;
        }

        const provider = new ethers.BrowserProvider(ethereum);
        const signer = provider.getSigner();
        const coinFlipContract = new ethers.Contract(contractAddress, contractABI, signer);

        // Convert bet amount to Wei
        const betInWei = ethers.parseEther(betAmount);  // Use ethers.parseEther instead of ethers.utils.parseEther

        // Send transaction
        const txn = await coinFlipContract.flipCoin(selectedSide === 'Heads', {
          value: betInWei,
        });

        console.log('Mining...', txn.hash);
        setStatus('Transaction sent. Waiting for confirmation...');
        await txn.wait();
        console.log('Mined -- ', txn.hash);
        setStatus('Transaction confirmed!');

        // Optionally, you can listen to events or check the result
        // For simplicity, we'll just update the contract balance
        getContractBalance();
      }
    } catch (error) {
      console.log(error);
      setStatus('Transaction failed or was rejected.');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <h1>Blockchain Coinflip Game</h1>
      {currentAccount ? (
        <div>
          <p>Connected Wallet: {currentAccount}</p>
          <p>Contract Balance: {contractBalance} ETH</p>
          <div>
            <label>
              Select Side:
              <select value={selectedSide} onChange={(e) => setSelectedSide(e.target.value)}>
                <option value="Heads">Heads</option>
                <option value="Tails">Tails</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Bet Amount (ETH):
              <input
                type="text"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.01"
              />
            </label>
          </div>
          <button onClick={flipCoin}>Flip Coin</button>
          <p>{status}</p>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}

export default App;
