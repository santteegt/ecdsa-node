import { toHex, utf8ToBytes, bytesToHex, hexToBytes } from 'ethereum-cryptography/utils';
import { getPublicKey, sign, utils } from 'ethereum-cryptography/secp256k1';
import { keccak256 } from 'ethereum-cryptography/keccak';

const PK = 'alchemy.burner_wallet.pk';
const ADDRESS = 'alchemy.burner_wallet.address';

const hashMessage = (message) => {
    const bytes = utf8ToBytes(message);
    return keccak256(bytes);
};

export const getActiveWallet = () => {
    return localStorage.getItem(ADDRESS);
};

export const createWallet = (opts = { override: false }) => {
    if (!localStorage.getItem(PK) || opts.override) {
        const privKey = utils.randomPrivateKey();
        const pubKey = getPublicKey(privKey);
        const hashedPubKey = keccak256(
            pubKey.slice(1), // take off the 1st byte as it indicates the format of the key
        );
        const address = `0x${toHex(hashedPubKey.slice(12))}`;
        localStorage.setItem(PK, bytesToHex(privKey));
        localStorage.setItem(ADDRESS, address);
        console.log('New Wallet Created', address);
        return address;
    }
    return getActiveWallet();
};

export const cleanup = () => {
    localStorage.removeItem(PK);
    localStorage.removeItem(ADDRESS);
};

export const signTx = async (data) => {
    if (!localStorage.getItem(PK)) throw Error('No Wallet!');
    const hashedMsg = hashMessage(data);
    const [signature, recoveryBit] = await sign(
        hashedMsg,
        hexToBytes(localStorage.getItem(PK)),
        { recovered: true },
    );
    return [
        bytesToHex(signature), // important to be sent as payload to the node
        recoveryBit,
    ];
};

// export default Wallet = {
//     cleanup,
//     createWallet,
//     getActiveWallet,
//     signTx,
// };