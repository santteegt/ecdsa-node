const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex, hexToBytes } = require("ethereum-cryptography/utils");
const e = require("express");

app.use(cors());
app.use(express.json());

const balances = {
  "0x1": {
    amount: 100,
    nonce: 0,
  },
  "0x2": {
    amount: 50,
    nonce: 0,
  },
  "0x3": {
    amount: 75,
    nonce: 0,
  },
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const state = balances[address];
  res.send({ balance: state?.amount || 0, nonce: state?.nonce || 0 });
});

app.post("/send", (req, res) => {
  const { sender, recipient, txAmount, txSignature, txRecoveryBit } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const { amount, nonce } = balances[sender];

  if (amount < txAmount ) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    const tx = {
      to: recipient,
      value: txAmount,
      nonce: nonce + 1,
    };
    const validSignature = isValidSignature(
      sender,
      JSON.stringify(tx),
      hexToBytes(txSignature), // properly encoding from payload
      txRecoveryBit,
    );
    if (!validSignature) {
      res.status(400).send({ message: "Invalid tx!" });
    } else {
      balances[sender].amount -= txAmount;
      balances[recipient].amount += txAmount;
      balances[sender].nonce += 1;
      res.send({ balance: balances[sender].amount, nonce: balances[sender].nonce });
    }
  }
});

app.post("/faucet", (req, res) => {
  const { sender, signature, recoveryBit } = req.body;
  if (!sender.startsWith('0x') && sender.length !== 42) {
    res.status(400).send({ message: "Invalid sender address!" });
  }
  if (balances[sender]?.amount) {
    res.status(400).send({ message: "Cannot request more funds from the faucet!" });
  }
  const validSignature = isValidSignature(
    sender,
    `Request faucet funds for ${sender}`,
    hexToBytes(signature), // properly encoding from payload
    recoveryBit,
  );
  if (!validSignature) {
    res.status(400).send({ message: "Invalid signature!" });
  }
  balances[sender] = {
    amount: 100,
    nonce: 0,
  };
  res.send({ balance: balances[sender].amount });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = {
      amount: 0,
      nonce: 0,
    };
  }
}

function hashMessage(message) {
  const bytes = utf8ToBytes(message);
  return keccak256(bytes);
}

function recoverKey(message, signature, recoveryBit) {
  const hashedMsg = hashMessage(message);
  return secp.recoverPublicKey(hashedMsg, signature, recoveryBit);
}

function isValidSignature(sender, message, signature, recoveryBit) {
  const pubKey = recoverKey(message, signature, recoveryBit);
  const hashedPubKey = keccak256(
      pubKey.slice(1), // take off the 1st byte as it indicates the format of the key
  );
  const address = `0x${toHex(hashedPubKey.slice(12))}`;
  return sender === address;
}