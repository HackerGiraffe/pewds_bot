/********************************** 
TODO:
- IMPORTANT: ADD A LOGGING SYSTEM
- IMPORTANT: ADD PROPER ERROR HANDLING
- Add Discord Bot functionality
	- Automatically pinging @everyone when the sub gap is low :D //Done, needs testing
- Improve Twitter functionality (tweet every x hours, maybe?)
- Add check for rate limiting (twitter only for now, I dont think we'd hit the google quota)
- Reddit functionality too?
- Telegram??
- ANY PLATFORM THAT SUPPORTS BOTS AND HAS A NODEJS API?????
**********************************/

//Utils
const chalk = require("chalk");
const humanize = require("humanize-number");

// Utils
const {
	getStats,
	updateStats,
	addListener
} = require("./util");

//Sources
const Twit = require('twit');

//Config and init
const CONFIG = require("./config.json");

//Stat updater
updateStats();
setInterval(() => {
	updateStats();
}, CONFIG.youtube.refreshdelay);

//Modules
require("./discord");
require("./reddit");

//Init twitter
if(!CONFIG.twitter) {
	console.log(chalk.red(`[Twitter] Missing credentials!`));
}

const T = new Twit({
	consumer_key: CONFIG.twitter.consumer_key,
	consumer_secret: CONFIG.twitter.consumer_secret,
	access_token: CONFIG.twitter.access_token,
	access_token_secret: CONFIG.twitter.access_token_secret
});

//Check twitter
T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    console.log(chalk.red(`[Twitter] Error logging in!`), err);
  })
  .then(function () {
	  console.log(chalk.green(`[Twitter] Logged in successfully!`));
});

//Listen for updates and maybe tweet about it
let direction = ""; //Stealing emoji idea from discord code
addListener((newStats, oldStats) => {
	if (oldStats) {
		direction = newStats.difference > oldStats.difference ? "📈" : "📉"; //Set emoji
		if (oldStats.difference >= 20000 && newStats.difference < 20000) {
			//If the subgap is now low
			console.log(chalk.yellow('[Twitter] PANIC MODE!'));
			T.post("statuses/update", {
				status: `CALLING ALL BROS! THE SUBGAP IS NOW ${humanize(newStats.difference)}! TAKE URGENT ACTION NOW!\n@pewdiepie @DolanDark @grandayy @MrBeastYT @Jack_Septic_Eye @markiplier @0xGiraffe`,
				auto_populate_reply_metadata: true
			}, (err) => {
				if (err) {
					console.log(chalk.red(`[Twitter] Failed to tweet about the subgap! ${err}`));
				} else {
					console.log(chalk.green(`[Twitter] Tweeted about the subgap drop successfully!`));
				}
			})
		}
	}
})

//Listen for tweets from TSeries, PewDiePie, grandayy, dolandark, mrbeast, Brad 1, Brad 2, youtube, youtube creators, jackseticeye, markiplier, donald trump (lol), lwiay bot
let users_arr = ["286036879", "39538010", '365956744', '427930773', '2455740283', '353990109', '4844061977', '10228272', '239760107', '77596200', '517077573', '25073877', '970472726564671488'];
const stream = T.stream("statuses/filter", {
	follow: users_arr
});
stream.on("tweet", async tweet => {
	//Check if it's not a RT by checking the twitter ID
	if (tweet.user && !tweet.in_reply_to_status_id && (users_arr.indexOf(tweet.user.id_str) >= 0)) {
		//Get the statistics
		const stats = getStats();
		let msg;
		if (stats.difference <= 25000) {
			//SOUND THE ALARM!
			msg = `CALLING ALL 9 YEAR OLDS! SUBSCRIBE TO PEWDIEPIE NOW! PewDiePie [${humanize(stats.pewdiepie)} subs] is currently ONLY ${humanize(stats.difference)} ${direction} subs ahead of TSeries [${humanize(stats.tseries)} subs]!
			#SavePewDiePie #SubscribeToPewDiePie`;
		} else {
			//Okay we're a good number away
			msg = `Subscribe to PewDiePie! PewDiePie [${humanize(stats.pewdiepie)} subs] is currently ${humanize(stats.difference)} ${direction} subs ahead of TSeries [${humanize(stats.tseries)} subs]!
			#SavePewDiePie #SubscribeToPewDiePie`;
		}

		//Actually reply to the said tweet
		T.post(
			"statuses/update", {
				status: msg,
				in_reply_to_status_id: tweet.id_str,
				auto_populate_reply_metadata: true
			},
			(err) => {
				if (err) {
					//If someone can improve this please do I hate error handling thanks
					console.log(chalk.red("[Twitter] Error tweeting!", err));
				} else {
					//Too lazy to check the data for an actual OK response, I'm sleepy and tired
					console.log(
						chalk.green(`[Twitter] Tweeted successfully at @${tweet.user.screen_name}!`)
					);
				}
			}
		);
	}
});
