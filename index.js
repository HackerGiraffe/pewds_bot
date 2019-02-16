/********************************** 
TODO:
- Add Discord Bot functionality
	- Commands like check_sub_gap, pewds_subs, tseries_subs, etc...
	- Automatically pinging @everyone when the sub gap is low :D
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
	getStats
} = require("./util");

//Sources
const Twit = require('twit');
const {
	YouTube
} = require('better-youtube-api');
const Discord = require('discord.js');

//Config and init
const CONFIG = require("./config.json");
const youtube = new YouTube(CONFIG.youtube.api_key);
const discord_token = CONFIG.discord.token;

//Init twitter
const T = new Twit({
	consumer_key: CONFIG.twitter.consumer_key,
	consumer_secret: CONFIG.twitter.consumer_secret,
	access_token: CONFIG.twitter.access_token,
	access_token_secret: CONFIG.twitter.access_token_secret
});

//Modules
require("./discord");

//Check twitter
T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    console.log(chalk.red(`[Twitter] Error logging in!`), err);
  })
  .then(function (result) {
	  console.log(chalk.green(`[Twitter] Logged in successfully!`));
});

//Listen for tweets from TSeries, PewDiePie, grandayy, dolandark, mrbeast
let users_arr = ["286036879", "39538010", '365956744', '427930773', '2455740283'];
const stream = T.stream("statuses/filter", {
	follow: users_arr
});
stream.on("tweet", async tweet => {
	//Check if it's not a RT by checking the twitter ID
	if (tweet.user && !tweet.in_reply_to_status_id && (users_arr.indexOf(tweet.user.id_str) >= 0)) {
		//Get the statistics
		getStats().then(res => {
			let msg;
			if (res.difference <= 25000) {
				//SOUND THE ALARM!
				msg = `CALLING ALL 9 YEAR OLDS! SUBSCRIBE TO PEWDIEPIE NOW! PewDiePie [${humanize(res.pewdiepie)} subs] is currently ONLY ${humanize(res.difference)} subs away from TSeries [${humanize(res.tseries)} subs]!
				#SavePewDiePie #SubscribeToPewDiePie`;
			} else {
				//Okay we're a good number away
				msg = `Subscribe to PewDiePie! PewDiePie [${humanize(res.pewdiepie)} subs] is currently ${humanize(res.difference)} subs away from TSeries [${humanize(res.tseries)} subs]!
				#SavePewDiePie #SubscribeToPewDiePie`;
			}

			//Actually reply to the said tweet
			T.post(
				"statuses/update", {
					status: msg,
					in_reply_to_status_id: tweet.id_str,
					auto_populate_reply_metadata: true
				},
				(err, data, response) => {
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
		});
	}
});