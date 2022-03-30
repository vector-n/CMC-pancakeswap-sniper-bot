/*
Coinmarketcap sniper bot that uses telegram notification from specific channel make sure you join the telegram channel before running the bot https://t.me/CMC_fastest_alerts
## Tips for you:
Turn on two step verification in telegram.
Go to my.telegram.org and create App to get api_id and api_hash.
*/
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import { NewMessage } from 'telegram/events/index.js';
import ethers from 'ethers';
import open from 'open';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();


// list of addresses needed to run the bot
const addresses = {
	WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB contract address that we will be buying the token from
	pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // Pancakeswap Router 
	buyContract: '0x3a8400Bf57398a5a1c40e52C3C96E6d2b44bAd43', // *DON'T CHANGE THIS* Buying contract to make buying orders much faster 
	recipient: process.env.recipient 
}

// connections to BSC
const privateKey = process.env.privatekey; // Your address private key 
const apiId = parseInt(process.env.apiId);
const apiHash = process.env.apiHash;
const stringSession = new StringSession(process.env.stringSession); // fill this later with the value from session.save() by editing ENV file
const node = process.env.node;
const wallet = new ethers.Wallet(privateKey);
const provider = new ethers.providers.WebSocketProvider(node);
//const provider = new ethers.providers.JsonRpcProvider(node);
const account = wallet.connect(provider);
//end: connections to BSC

//functions and events
const pancakeAbi = [
	'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
	'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
	'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
	'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)'
];
const tokenAbi = [
	'function approve(address spender, uint amount) public returns(bool)',
	'function balanceOf(address account) external view returns (uint256)',
	'event Transfer(address indexed from, address indexed to, uint amount)',
	'function name() view returns (string)',
	'function buyTokens(address tokenAddress, address to) payable',
	'function decimals() external view returns (uint8)'
];
//end: function and events


// date input (Edit these data)
const data =
{
    investmentAmount: '0.1', 	// Investment amount per token
    maxBuyTax: 20,      	// max buy tax
    minBuyTax: 0,		    	// min buy tax
    maxSellTax: 20,   		// max sell tax
    maxLiquidity: 10000,  // max Liquidity BNB
    minLiquidity: 5, 	  	// min Liquidity BNB
    profitPercent: 15,    // 50% profit
    stopLossPercent: 5,   // 10% loss
    percentOfTokensToSellProfit: 75, // sell 75% of tokens when profit is reached
    percentOfTokensToSellLoss: 100, // sell 100% of tokens when stoploss is reached
    trailingStopLossPercent: 10, // % trailing stoploss
    
    gasPrice: ethers.utils.parseUnits('5', 'gwei'), // Gas price 
    gasLimit: 350000, // Gas Limit 
    slippage: 10 // the higher the slippage the less chance the transaction won't failed 
}
//end of data

// Properties 
const buyContract = new ethers.Contract(addresses.buyContract, tokenAbi, account);
const pancakeRouter = new ethers.Contract(addresses.pancakeRouter, pancakeAbi, account);

// ** Don't change these ** 
var client;
let token = [];
var sellCount = 0;
var buyCount = 0;
var dontBuyTheseTokens;
const autoSell = true; // Type "false" if you don't want the bot to auto sell the token
const numberOfTokensToBuy = 5; // How many token you want to buy 
const channel = 'CMC';
const chID = 1519789792;
// end: Properties 


// Starting telegram setups
(async () => {
  const client = new TelegramClient(new StringSession(process.env.stringSession), apiId, apiHash, { 
          useWSS:true, 
          connectionRetries: 5,
});
	await client.start({
		phoneNumber: async () => await input.text("Please, type your telegram Phone number:"),
		password: async () => await input.text("Type the password of your telegram account:"),
		phoneCode: async () => await input.text("Type the code that have sent to your account:"),
		onError: (err) => console.log(err),
	});
  	console.log(chalk.green("Your string session is:", client.session.save(), '\n'));
  	console.log("Copy the string above ^^ and paste in .env file stringSession, if you already did that please ignore this message.\n")
	  console.log(chalk.green('=================================================='));
	  console.log(chalk.green(`Current Version of the bot is v1.0.0`));
    console.log(chalk.green('=================================================='));
    console.log(chalk.green(`Coin Market Cap - Sniper bot\n`));
    console.log(chalk.green(`wallet address: ${wallet.address}`));
    console.log(chalk.green(`Amount of BNB to snipe - ${data.investmentAmount}`, 'BNB'));
    console.log(chalk.green(`Maximum Buy tax - ${data.maxBuyTax}`, '%'));
    console.log(chalk.green(`Minimum Buy tax - ${data.minBuyTax}`, '%'));
    console.log(chalk.green(`Maximum Sell tax - ${data.maxSellTax}`, '%'));
    console.log(chalk.green(`Maximum Liquidity - ${data.maxLiquidity}`, 'BNB'));
    console.log(chalk.green(`Minimum Liquidity - ${data.minLiquidity}`, 'BNB'));
    console.log(chalk.green(`Profit Percentage - ${data.profitPercent}`, '%\n'));
    console.log(chalk.green('Proceeding to snipe...'));
	console.log(chalk.green('=================================================='));

	let raw = await readFile('tokensBought.json');
	let tokensBought = JSON.parse(raw);
	dontBuyTheseTokens = tokensBought.tokens;
	client.addEventHandler(onNewMessage, new NewMessage({}));
//	console.log("...");
})();

async function readFile(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			}
			resolve(data);
		});
	});
}

async function onNewMessage(event) {

	const message = event.message;
	if (channel == 'CMC') {
		onNewMessageCMC(message);
	} else {
		console.log(chalk.red("Invalid Channel"));
	}
}


// Listening for telegram new message 
function onNewMessageCMC(message) {

	if (message.peerId.channelId == chID) {
		console.log(chalk.blue('--- NEW TOKEN FOUND FROM COINMARKETCAP FASTEST ALERTS CHANNEL ---'));
		let timeStamp = new Date().toLocaleString();
		console.log(timeStamp);
		const msg = message.message.replace(/\n/g, " ").split(" ");
		var address = '';

		for (var i = 0; i < msg.length; i++) {
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~');
			if (msg[i] == "BNB") {
				var liquidity = parseFloat(msg[i - 1]);
				console.log(chalk.yellow('Liquidity:', liquidity, 'BNB'));
			}
			if (msg[i] == "(buy)") {
				var slipBuy = parseInt(msg[i - 1]);
				console.log(chalk.yallow('Buy tax: ', slipBuy, '%'));
			}
			if (msg[i] == "(sell)") {
				var slipSell = parseInt(msg[i - 1]);
				console.log(chalk.yellow('Sell tax:', slipSell, '%'));
			}
			if (ethers.utils.isAddress(msg[i])) {
				address = msg[i];
				console.log(chalk.blue('Contract:', address));
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~');
			}
		}
	
		if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes("Insider")) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: data.investmentAmount,
				profitPercent: data.profitPercent,
				stopLossPercent: data.stopLossPercent,
				gasPrice: data.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: data.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: data.percentOfTokensToSellLoss,
				trailingStopLossPercent: data.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				previousValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		else {
			console.log(chalk.red('Not buying this token, it does not match strategy or liquidity is not BNB. Waiting for telegram notification to try and buy again...', '\n'));
		}
	}

}

// Chacking the strategy set up
function isStrategy(liquidity, buyTax, sellTax, msg, address) {
		if (liquidity <= data.maxLiquidity &&
			liquidity >= data.minLiquidity &&
			buyTax <= data.maxBuyTax &&
			buyTax >= data.minBuyTax &&
			sellTax <= data.maxSellTax && msg.includes("BNB") && didNotBuy(address)) {
			return true;
		}
	return false;
}

// Confirm if the token haven't been brought before 
function didNotBuy(address) {

	for (var j = 0; j < dontBuyTheseTokens.length; j++) {
		if (address == dontBuyTheseTokens[j].address) {
			return false;
		}
	}
	return true;
}


// Buying the token 
async function buy() {
		if (buyCount < data.numberOfTokensToBuy) {
			const value = ethers.utils.parseUnits(token[buyCount].investmentAmount, 'ether').toString();
			const tx = await buyContract.buyTokens(token[buyCount].tokenAddress, addresses.recipient,
				{
					value: value,
					gasPrice: data.gasPrice,
					gasLimit: data.gasLimit

				});
			const receipt = await tx.wait();
			console.log(chalk.green("\u001b[1;32m" + "✔ Buy transaction hash: ", receipt.transactionHash, "\u001b[0m"));
			token[buyCount].didBuy = true;
			const dextoolURL = new URL(token[buyCount].tokenAddress, 'https://www.dextools.io/app/bsc/pair-explorer/');
			open(dextoolURL.href);
			buyCount++;
			fs.readFile('tokensBought.json', 'utf8', function readFileCallback(err, data) {
				if (err) {

				} else {
					var obj = JSON.parse(data);
					obj.tokens.push({ address: token[buyCount - 1].tokenAddress });
					json = JSON.stringify(obj, null, 4);
					fs.writeFile('tokensBought.json', json, 'utf8', function (err) {
						if (err) throw err;

					});
				}
			});
			approve();
		}
}


// Approve the token
async function approve() {
		let contract = token[buyCount - 1].contract;
		const valueToApprove = ethers.constants.MaxUint256;
		const tx = await contract.approve(
			pancakeRouter.address,
			valueToApprove, {
			gasPrice: data.gasPrice,
			gasLimit: 210000
		}
		);
		const receipt = await tx.wait();
		console.log(chalk.green("Approve transaction hash: ", receipt.transactionHash, "\n"));
	//	confirm autosell is true
		if (data.autoSell) {
			token[buyCount - 1].checkProfit();
		} else {
			if (buyCount == data.numberOfTokensToBuy) {
				process.exit();
			}
		}
}

// Chacking Profit
async function getCurrentValue(token) {
	let bal = await token.contract.balanceOf(addresses.recipient);
	const amount = await pancakeRouter.getAmountsOut(bal, token.sellPath);
	let currentValue = amount[1];
	return currentValue;
}
async function setInitialStopLoss(token) {
	token.intitialValue = await getCurrentValue(token);
	token.newValue = token.intitialValue;
	token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.intitialValue)) - parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.stopLossPercent / 100)).toFixed(8).toString());
}

async function setNewStopLoss(token) {
	token.newValue = token.currentValue;
	// new stop loss equals current value - (current value * stop loss percent) 
	token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.currentValue)) - parseFloat(ethers.utils.formatUnits(token.currentValue)) * (token.stopLossPercent / 100)).toFixed(8).toString());
}
async function checkForProfit(token) {
	try {
		var sellAttempts = 0;
		await setInitialStopLoss(token);
		token.contract.on("Transfer", async (from, to, value, event) => {
			token.previousValue = token.currentValue;
			const tokenName = await token.contract.name();
			let currentValue = await getCurrentValue(token);
			token.currentValue = currentValue;
			let currentValueString = parseFloat(ethers.utils.formatUnits(currentValue)).toFixed(8).toString();
			const takeProfit = (parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.profitPercent + token.tokenSellTax) / 100 + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(8).toString();
			const profitDesired = ethers.utils.parseUnits(takeProfit);
			let targetValueToSetNewStopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.newValue)) * (token.trailingStopLossPercent / 100) + parseFloat(ethers.utils.formatUnits(token.newValue))).toFixed(8).toString());
			let stopLoss = token.stopLoss;

			// if current value is greater than targetValue, set a new stop loss
			if (currentValue.gt(targetValueToSetNewStopLoss) && token.trailingStopLossPercent > 0) {
				setNewStopLoss(token);
				console.log(chalk.blue("\u001b[38;5;33m" + "Setting new StopLoss!" + "\u001b[0m"));
			}
			let timeStamp = new Date().toLocaleString();
			const enc = (s) => new TextEncoder().encode(s);
			
			try {
				if (token.previousValue.gt(token.currentValue)) {

					console.log(`-- ${tokenName} -- Current Value in BNB: ${"\u001b[1;31m" + currentValueString + "\u001b[0m"} -- Will take Profit At: ${ethers.utils.formatUnits(profitDesired)} -- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)} -- New Stop loss At: ${ethers.utils.formatUnits(targetValueToSetNewStopLoss)}`);

				} else {

					console.log(`-- ${tokenName} -- Current Value in BNB: ${"\u001b[1;32m" + currentValueString + "\u001b[0m"} -- Will take Profit At: ${ethers.utils.formatUnits(profitDesired)} -- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)} -- New Stop loss At: ${ethers.utils.formatUnits(targetValueToSetNewStopLoss)}`);

				}
			}
			catch (e) {

			}

			if (currentValue.gte(profitDesired)) {
				if (buyCount <= data.numberOfTokensToBuy && token.didBuy && sellAttempts == 0) {
					sellAttempts++;
					console.log(chalk.blue("<<< Selling -", tokenName, "- now" + "\u001b[1;32m" + " Profit target " + "\u001b[0m" + "reached >>>", "\n"));
					sell(token, true);
					token.contract.removeAllListeners();
				}
			}

			if (currentValue.lte(stopLoss)) {
				console.log("\u001b[38;5;33m" + "less than StopLoss!" + "\u001b[0m");
				if (buyCount <= data.numberOfTokensToBuy && token.didBuy && sellAttempts == 0) {
					sellAttempts++;
					console.log(chalk.blue("<<< Selling -", tokenName, "- now" + "\u001b[1;31m" + " StopLoss " + "\u001b[0m" + "reached >>>", "\n"));
					sell(token, false);
					token.contract.removeAllListeners();
				}
			}
		});
	} catch (e) {
		console.log(e);
	}
}


// Selling the token
async function sell(tokenObj, isProfit) {
	try {
		const bal = await tokenObj.contract.balanceOf(addresses.recipient);
		const decimals = await tokenObj.contract.decimals();
		var balanceString;
		if (isProfit) {
			balanceString = (parseFloat(ethers.utils.formatUnits(bal.toString(), decimals)) * (tokenObj.percentOfTokensToSellProfit / 100)).toFixed(decimals);
		} else {
			balanceString = (parseFloat(ethers.utils.formatUnits(bal.toString(), decimals)) * (tokenObj.percentOfTokensToSellLoss / 100)).toFixed(decimals);
		}
		var roundedBalance = Math.floor(balanceString * 100) / 100
		const balanceToSell = ethers.utils.parseUnits(roundedBalance.toString(), decimals);
		const sellAmount = await pancakeRouter.getAmountsOut(balanceToSell, tokenObj.sellPath);
		const sellAmountsOutMin = sellAmount[1].sub(sellAmount[1].div(`${data.slippage}`));
		if (tokenObj.tokenSellTax > 1) {
		
		// Selling the token
			const tx = await pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
				sellAmount[0].toString(),
				0,
				tokenObj.sellPath,
				addresses.recipient,
				Math.floor(Date.now() / 1000) + 60 * 20, {
				gasPrice: data.gasPrice,
				gasLimit: data.gasLimit

			}
			);
			const receipt = await tx.wait();
			console.log(chalk.green("\u001b[1;32m" + "✔ Sell transaction hash: ", receipt.transactionHash, "\u001b[0m", "\n"));
			sellCount++;
			token[tokenObj.index].didSell = true;
			let name = await tokenObj.contract.name();
		} else {
			const tx = await pancakeRouter.swapExactTokensForETH(
				sellAmount[0].toString(),
				0,
				tokenObj.sellPath,
				addresses.recipient,
				Math.floor(Date.now() / 1000) + 60 * 20, {
				gasPrice: data.gasPrice,
				gasLimit: data.gasLimit,

			}
			);
			const receipt = await tx.wait();
			console.log(chalk.green("\u001b[1;32m" + "✔ Sell transaction hash: ", receipt.transactionHash, "\u001b[0m", "\n"));
			sellCount++;
			let name = await tokenObj.contract.name();
		}
		if (buyCount == data.numberOfTokensToBuy) {
			console.log(chalk.green("All tokens sold"));
			process.exit();
		}

	} catch (e) {
		
	}
}
