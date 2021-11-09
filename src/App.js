import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');

      //Call Solana Program here

      //Set state
      setGifList(TEST_GIFS);
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
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
    } else {
      console.log('Empty input. Try again.');
    }
  };

  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect to wallet</button>
  )

  const renderConnectedContainer = () => (
    <div className="connected-container">
      <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange} />
      <button className="cta-button submit-gif-button" onClick={sendGif}>Submit</button>
      <div className="gif-grid">
        {gifList.map(gif => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  )


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
