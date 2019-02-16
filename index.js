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
const chalk = require('chalk');
const humanize = require('humanize-number');

//Sources
const Twit = require('twit');
const { YouTube } = require('better-youtube-api');
const Discord = require('discord.js');

//Config and init
const CONFIG = require('./config.json');
const youtube = new YouTube(CONFIG.youtube.api_key);
const discord_token = CONFIG.discord.token;

//Init twitter
const T = new Twit({
	consumer_key: CONFIG.twitter.consumer_key,
	consumer_secret: CONFIG.twitter.consumer_secret,
	access_token: CONFIG.twitter.access_token,
	access_token_secret: CONFIG.twitter.access_token_secret
});


function getStats() {
	return new Promise(async resolve => {
		const [pewdiepie, tseries] = await Promise.all([
			youtube.getChannel('UC-lHJZR3Gqxm24_Vd_AJ5Yw'),
			youtube.getChannel('UCq-Fj5jknLsUf-MWSy4_brA')
		  ]);
		  resolve({
			  pewdiepie: parseInt(pewdiepie.data.statistics.subscriberCount),
			  tseries: parseInt(tseries.data.statistics.subscriberCount),
			  difference: parseInt(pewdiepie.data.statistics.subscriberCount - tseries.data.statistics.subscriberCount) //Javascript wonders
		  })
	})
  }

//Listen for tweets from TSeries, PewDiePie, grandayy, dolandark, mrbeast
const stream = T.stream('statuses/filter', {
	follow: ['286036879', '39538010', '365956744', '427930773', '2455740283']
});
stream.on('tweet', (tweet) => {
	//No replies, only RTs and base tweets. Should reduce amount of tweets.
	if (tweet.user && !tweet.in_reply_to_status_id) {
		//Get the statistics
		getStats().then(res => {
			let msg;
			if (res.difference <= 25000) {
				//SOUND THE ALARM!
				msg = `CALLING ALL 9 YEAR OLDS! SUBSCRIBE TO PEWDIEPIE NOW! PewDiePie [${humanize(res.pewdiepie)} subs] is currently ONLY ${humanize(res.difference)} subs ahead of TSeries [${humanize(res.tseries)} subs]!
				#SavePewDiePie #SubscribeToPewDiePie`;
			} else {
				//Okay we're a good number away
				msg = `Subscribe to PewDiePie! PewDiePie [${humanize(res.pewdiepie)} subs] is currently ${humanize(res.difference)} subs ahead of TSeries [${humanize(res.tseries)} subs]!
				#SavePewDiePie #SubscribeToPewDiePie`;
			}

			//Actually reply to the said tweet
			T.post('statuses/update', {
				status: msg,
				in_reply_to_status_id: tweet.id_str,
				auto_populate_reply_metadata: true
			}, (err, data, response) => {
				if (err) {
					//If someone can improve this please do I hate error handling thanks
					console.log(chalk.red('Error tweeting!', err));
				} else {
					//Too lazy to check the data for an actual OK response, I'm sleepy and tired
					console.log(chalk.green(`Tweeted successfully at @${tweet.user.screen_name}!`));
				}
			});
		});
	}
});

// Discord
const discord_client = new Discord.Client();
prefix = '!';

discord_client.on('message', message => {
    mc = message.content.toLowerCase();
	if (!mc.startsWith(prefix) || message.author.bot) return;
	
	//Huge thanks to papiersnipper for this!
	if (mc === `${prefix}check_sub_gap` || mc === `${prefix}sub_gap` || mc === `${prefix}gap`) {
		getStats().then(res => {
			msg = `PewDiePie \`(${humanize(res.pewdiepie)} subs)\` is currently **${humanize(res.difference)}** subs away from T-Series \`(${humanize(res.tseries)} subs)\``;
		return message.channel.send(msg)
	});

	} else if (mc === `${prefix}pewds_subs` || mc === `${prefix}pewds` || mc === `${prefix}pewdiepie`) {
		getStats().then(res => {
			msg = `PewDiePie currently has **${humanize(res.pewdiepie)}** subs`;
		return message.channel.send(msg)
    });

	} else if (mc === `${prefix}tseries_subs` || mc === `${prefix}tseries` || mc === `${prefix}t-series`) {
		getStats().then(res => {
			msg = `T-Series currently has **${humanize(res.tseries)}** subs`;
		return message.channel.send(msg)
		});
	} else return;
});

discord_client.login(discord_token);
