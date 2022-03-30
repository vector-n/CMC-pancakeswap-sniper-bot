# CMC-pancakeswap-sniper-bot
The fastest Sniper bot that snipe any token that will be listed on Coinmarketcap on telegram https://t.me/CMC_fastest_alerts 
The bot works on every system including android.

## Updates 

* Bot version 1.0 ( added checking profit and setting StopLoss before selling)

## Prerequisites
1) First install nodejs in your system ( Windows, Linux, Android)
2) Clone this repository with git ( make sure you have `git` installed first )
```
git clone github.com/abu0ali/CMC-pancakeswap-sniper-bot.git
```
3) Go to [telegram](https://my.telegram.org/) and sign in, then click on API developement tools > Create application, then copy you API_ID and API_HASH
4) Open terminal in bot directory and run `npm install` to install all dependencies
## Bot configuration 
Open `.env` file in the directory of the bot. There are some requirements that need to be added before using the bot.
* `recipient:` which is your address ( the address you want to pay the gas and buying the tokens )
* `privatekey:` the private key of your address 
* `apiId:` the API_ID which we copied previously from telegram ( see step 3 )
* `apiHash:` the API_HASH which we copied previously from telegram ( see step 3 )
* `stringSession:` the stringSession is code that will be generated automatically when you login in telegram in the first time you run the bot, you can copy it then paste here so you don't have to login again. 
* `node:` the node that will connect the bot to BSC blockchain, you can get yours by singing at [Moralis](https://moralis.io/) for free or use paid node at [Quicknode](https://www.quicknode.com/)

Make sure you fill the boxes correctly or else the bot won't work

## How to run the Bot? 
After setting up everything Open terminal on your device and go to the bot directory then use the following command:
```
node bot.js 
```
## How it works
1. The bot will listen to new message on the telegram channel and scan if the token is within the buying requirement.
2. The bot will buy the token as soon as it appears in the channel 
3. The bot will automatically approve the token that have been brought 
4. The bot will track the token until it reaches the profit that been set 
5. Once the profits is reached the bot will sell the token automatically

## Future development 
The bot is still under development so there will be some technical errors but it's being updated regularly so far the bot is able to scan, buy, approve and auto sell the token, 

### For the next updates:
Develop fully customisable settings such as 
1. Profit setting and add wide range of strategies 
2. StopLoss, Trailing StopLoss Percent
3. Added more channel to buy from
4. Friendly interface so you don't have to struggle with the bot

### For the "far" updates:
The bot will be able to notify you when the buy and sell is occurred, also the bot will be available for other blockchain ( Etherume, Polkadot, Polygon, Avalanche and more ) so stay tune 😉 


I'm working on other bot that will buy every token listed on Pancakeswap with settings the range of liquidity and other bot that will snipe specific token before it get listed on Pancakeswap with the same block the liquidity added to Pancakeswap. So make sure to follow me he or join our [telegram group](t.me/CMC_Sniper) and say hi 👋 😊 


# Disclaimer 
The bot is in beta mode so use it in your risk, sometimes you will gain profit using the bot and sometimes you will lose, the bot will buy every token on the fastest alerte channel so DYOR, There is small amount 0.7% buying fee for each buy to help the project and keep me going for more development any donation is appreciated.

0xBFE4b1258C4138921397Ff22350e2537FfF9Ea8a

You can support me by hitting star and you are free to fork this repository or edit it and play around with it. ❤
If you have any further questions or issues please feel free to contact me on telegram at [telegram.me/CMC_Sniper](t.me/CMC_Sniper)
