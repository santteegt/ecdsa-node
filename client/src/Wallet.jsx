import { useEffect } from 'react';
import server from "./server";
import { getActiveWallet, createWallet, signTx } from './bwallet';

function Wallet({
  address,
  setAddress,
  balance,
  setBalance,
  currentNonce,
  setNonce,
}) {
  const fetchWalletState = async () => {
    if (address.startsWith('0x') && address.length === 42) {
      const {
        data: { balance, nonce },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
      setNonce(nonce);
    } else {
      setBalance(0);
      setNonce(0);
    }
  };

  const newWallet = () => {
    setAddress(createWallet({override: false}));
  };

  const faucetRequest = async () => {
    // newWallet();
    try {
      const [signature, recoveryBit] = await signTx(`Request faucet funds for ${address}`);
      const {
        data: { balance },
      } = await server.post('faucet', {
        sender: address,
        signature,
        recoveryBit,
      });
      setBalance(balance);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setAddress(getActiveWallet() || '');
  }, []);

  useEffect(() => {
    if (address) {
      fetchWalletState();
    }
  }, [address]);

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Wallet Address
        <input
          placeholder="No Active Wallet"
          value={address}
          onChange={(evt) => setAddress(evt.target.value) }
          disabled={!address}
        />
      </label>
      <label>
        Nonce
        <input
          value={currentNonce}
          onChange={(evt) => setNonce(Number(evt.target.value))}
        />
      </label>
      {!address && (
        <button onClick={newWallet}>
          Create Burner Wallet
        </button>
      )}
      {address && !balance && (
        <button onClick={faucetRequest}>
          Request Faucet
        </button>
      )}

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
