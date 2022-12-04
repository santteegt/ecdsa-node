import Wallet from "./Wallet";
import Transfer from "./Transfer";
import "./App.scss";
import { useState } from "react";

function App() {
  const [balance, setBalance] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [address, setAddress] = useState('');

  return (
    <div className="app">
      <Wallet
        balance={balance}
        setBalance={setBalance}
        address={address}
        setAddress={setAddress}
        currentNonce={nonce}
        setNonce={setNonce}
      />
      <Transfer
        address={address}
        nonce={nonce}
        setBalance={setBalance}
        setNonce={setNonce}
      />
    </div>
  );
}

export default App;
