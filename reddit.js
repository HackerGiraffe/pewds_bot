const CONFIG = require('./config.json')
const humanize = require('humanize-number')
const chalk = require('chalk')
const Snoowrap = require('snoowrap')
const Snoostorm = require('snoostorm')
const {
	getStats,
	addListener
} = require('./util')

let direction = ''
addListener((newStats, oldStats) => {
	if (oldStats) {
		direction = newStats.difference > oldStats.difference ? '📈' : '📉'
	}

	// TODO: Post to r/pewdiepie when subs are low
})

// Init reddit
const r = new Snoowrap({
	userAgent: CONFIG.reddit.user_agent,
	clientId: CONFIG.reddit.client_id,
	clientSecret: CONFIG.reddit.client_secret,
	username: CONFIG.reddit.user,
	password: CONFIG.reddit.pass
})
const client = new Snoostorm(r);
console.log(chalk.green(`[Reddit] Logged in!`))

// Options for streaming posts
const streamOpts = {
	subreddit: 'all',
	results: 100
}

const comments = client.CommentStream(streamOpts)

// On comment, perform whatever logic you want to do
comments.on('comment', (comment) => {
	if (comment.body.toLowerCase().indexOf('p!subgap') >= 0 || comment.body.toLowerCase().indexOf('p!gap') >= 0) {
		const stats = getStats()
		// Weird but yeah
		comment.reply(`PewDiePie is ahead of TSeries by **${humanize(stats.difference)}** ${direction} subscribers.  
		PewDiePie: **${humanize(stats.pewdiepie)}** subs  
		TSeries: **${humanize(stats.tseries)}** subs  
***
^(I'm a bot created by u/HackerGiraffe (@0xGiraffe)! Find out more information [here](https://github.com/hackergiraffe/pewds_bot))
`).then(() => {
			console.log(chalk.green(`[Reddit] Replying to u/${comment.author.name} in ${comment.subreddit_name_prefixed} [${comment.permalink}]`));
		}).catch((err) => {
			console.log(chalk.red('[Reddit] Failed to post comment to Reddit!'), err);
		})
	}
})