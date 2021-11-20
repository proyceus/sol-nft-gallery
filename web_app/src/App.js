import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json';

//systemprogram is a reference to the Solana runtime
const { SystemProgram, Keypair } = web3;

//create a keypair for the account that will hold the GIF data
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

//get your program's id from the IDL file
const programID = new PublicKey(idl.metadata.address);

//set our network to devnet
const network = clusterApiUrl('devnet');

//controls how we want to acknowledge when a transaction is 'done'
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
  'https://media.giphy.com/media/3o7qE2VAxuXWeyvJIY/giphy.gif',
	'https://media.giphy.com/media/DhstvI3zZ598Nb1rFf/giphy.gif',
	'https://media.giphy.com/media/mFTIkcmQWTbNFrTp2O/giphy.gif',
	'https://media.giphy.com/media/F9hQLAVhWnL56/giphy.gif',
  'https://media.giphy.com/media/w7mLEAMcpjrpe/giphy.gif',
  'https://media.giphy.com/media/tsX3YMWYzDPjAARfeg/giphy.gif'
]

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  //checks to see if user has Phantom wallet

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          console.log(solana);

          //Solana object will give a function that will allow us to connect directly with user's wallet
          const response = await solana.connect({ onlyIfTrusted: true });

          console.log('Connected with Public Key: ', response.publicKey.toString());

          //save user's public address for use later
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom wallet');
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (err) {
      console.log("Error in getGifList: ", err);
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');

      //Call Solana Program here
      getGifList();
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key: ', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return;
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        },
      });

      console.log("GIF successfully sent to program", inputValue);

      await getGifList();
    } catch (err) {
      console.log("Error sending GIF:", err);
    }
  };

  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, window.solana, opts.preflightCommitment);
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString());
      await getGifList();
    } catch (err) {
      console.log("Error creating BaseAccount account:", err);
    }
  }

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect to wallet</button>
  )

  const renderConnectedContainer = () => {
    //if we hit this, it means the program account hasn't been initialized
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    // else, we're good and the account exists
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }

  }


  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">GIF Dance Party</p>
          <p className="sub-text">
            Add your favorite dancing GIFs!
          </p>
          {!walletAddress ? renderNotConnectedContainer() : renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
