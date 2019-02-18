const Discord = require('discord.js')
const CONFIG = require('./config.json')
const humanize = require('humanize-number')
const chalk = require('chalk')
const client = new Discord.Client() // instantiate a new Discord.Client
const {
	getStats,
	addListener
} = require('./util')

// Global emoji (for subgap) because I can
let direction = ''

const createEmbed = () => {
	let embed = new Discord.RichEmbed()
	embed.setFooter(`PewdsBot - Serving ${client.guilds.size} servers [Created by HackerGiraffe]`)
	embed.setTimestamp()
	embed.setURL('https://github.com/hackergiraffe/pewds_bot')
	//   embed.setThumbnail(CONFIG.discord.thumbnail); //No thumbnail for now
	embed.setTitle('PewdsBot')
	return embed
}

const updatePresence = (stats, oldStats) => {
	if (oldStats) {
		direction = stats.difference > oldStats.difference ? '📈' : '📉'
	}
	client.user.setPresence({
		game: {
			name: `sub gap: ${humanize(stats.difference)}${direction}`,
			type: 'WATCHING'
		}
	})
}

const commands = [{
		command: 'check_sub_gap',
		aliases: ['checksubgap', 'subgap', 'gap'],
		description: 'Shows the subscriber gap between PewDiePie and TSeries.',
		executor: async msg => {
			const {
				pewdiepie,
				tseries,
				difference
			} = getStats()
			const embed = createEmbed()
			embed.addField('PewDiePie', humanize(pewdiepie), true)
			embed.addField('T-Series', humanize(tseries), true)
			embed.setDescription(
				`PewDiePie is currently **${humanize(difference)}** ${direction} subscribers ahead of T-Series`
			)
			if (difference < CONFIG.subgap_limit) {
				embed.setColor('RED')
			} else if (difference < 0) { // When T-Series has more subs than Pewds
				embed.setColor('DARK_RED')
			} else { // Everything's fine
				embed.setColor('GREEN')
			}
			await msg.channel.send(embed)
		}
	},
	{
		command: 'pewdiepie_subs',
		aliases: [
			'pewds_subs',
			'pewdssubs',
			'pewdsubs',
			'pewdiepie',
			'pewds',
			'pewd'
		],
		description: 'Shows how many subs PewDiePie has.',
		executor: async msg => {
			const {
				pewdiepie
			} = getStats()
			const embed = createEmbed()
			embed.setDescription(
				`PewDiePie currently has **${humanize(pewdiepie)}** subscribers.`
			)
			await msg.channel.send(embed)
		}
	},
	{
		command: 't-series_subs',
		aliases: ['tseriessubs', 'tseries_subs', 't-series', 'tseries'],
		description: 'Shows how many subs TSeries has.',
		executor: async msg => {
			const {
				tseries
			} = getStats()
			const embed = createEmbed()
			embed.setDescription(
				`T-Series currently has **${humanize(tseries)}** subscribers.`
			)
			await msg.channel.send(embed)
		}
	},
	{
		command: 'help',
		aliases: ['h'],
		description: 'Displays help...duh?',
		executor: async msg => {
			let embed = createEmbed()
			embed.setDescription(`A list of all commands you can use! The current prefix for PewdsBot is "${CONFIG.discord.prefix}"`)
			// Ugly for loop but I need it to be sync
			for (let i = 0; i < commands.length; i++) {
				embed.addField(commands[i].command, `${commands[i].description}\n*Alternate forms: ${commands[i].aliases.join(', ')}*`)
			}
			await msg.channel.send(embed)
		}
	}
]

// When joining a server, say hi!
client.on('guildCreate', guild => {
	console.log(chalk.blue(`[Discord] New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`))

	// Ripped from stackoverflow
	let channelID
	let channels = guild.channels
	for (let c of channels) {
		let channelType = c[1].type
		if (channelType === 'text') {
			channelID = c[0]
			break;
		}
	}
	let channel = client.channels.get(guild.systemChannelID || channelID)
	channel.send(`Thanks for inviting me to the server! Type \`${CONFIG.discord.prefix}help\` for information on commands!`)
})

// When leaving a server, just tell us
client.on('guildDelete', guild => {
	// this event triggers when the bot is removed from a guild.
	console.log(chalk.blue(`[Discord] I have been removed from: ${guild.name} (id: ${guild.id})`))
})

// TODO: BETTER HANDLING
// Error handling to prevent crashing
client.on('error', err => {
	console.log(chalk.red(`[Discord] Error! ${err}`))
})

client.on('ready', () => {
	// discord.js ready event
	console.log(chalk.green('[Discord] PewdsBot ready!'))
	updatePresence(getStats())

	addListener((newStats, oldStats) => {
		updatePresence(newStats, oldStats)

		if (oldStats) {
			// Only send message when going from 25k+ -> <25
			if ((oldStats.difference > CONFIG.subgap_limit) && (newStats.difference < CONFIG.subgap_limit)) {
				console.log(chalk.yellow('[Discord] PANIC MODE!'));
				// TODO: testing the low sub gap warning (might remove the @here for @everone hmm)
				let toSay = `**WARNING! CALLING ALL 9 YEAR OLDS! THE SUBGAP IS NOW ${humanize(newStats.difference)}! WE MUST NOT LOSE THIS FIGHT AGAINST TSERIES!**`
				client.guilds.map((guild) => {
					let found = 0
					guild.channels.map((c) => {
						if (found === 0) {
							if (c.type === 'text') {
								if (c.permissionsFor(client.user).has('VIEW_CHANNEL') === true) {
									if (c.permissionsFor(client.user).has('SEND_MESSAGES') === true) {
										console.log(chalk.green(`[Discord] Alert message sent to ${guild}!`));
										c.send(toSay)
										found = 1
									}
								}
							}
						}
					})
				})
			}
		}
	})
})

client.on('message', async msg => {
	// discord.js message event
	try {
		if (msg.author.bot || msg.author === client.user) return // Checks if executor is bot/self
		if (!msg.content.startsWith(CONFIG.discord.prefix)) return
		let cmdTxt = msg.content.substr(CONFIG.discord.prefix.length)
		let cmd = commands.find(item => {
			// Find a command using predicate
			return item.command === cmdTxt || item.aliases.includes(cmdTxt)
		})
		if (!cmd) {
			msg.channel.send('Invalid command.')
			return
		} // command not found
		await cmd.executor(msg)
		console.log(chalk.blue(`[Discord] Executing ${cmdTxt} by ${msg.author.username} ${msg.author} in ${msg.guild || 'PM'} [${msg.guild.id}]`))
	} catch (err) {
		console.error(chalk.red('[Discord] Error in message handler!'), err)
	}
})

client.login(CONFIG.discord.token) // Logs in with Token at CONFIG.discord.token