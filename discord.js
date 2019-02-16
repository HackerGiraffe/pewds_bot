const Discord = require("discord.js");
const CONFIG = require("./config.json");
const humanize = require("humanize-number");
const chalk = require("chalk");

const client = new Discord.Client(); // instantiate a new Discord.Client
const { getStats } = require("./util");
const createEmbed = () => {
  let embed = new Discord.RichEmbed();
  embed.setFooter("PewdsBot");
  embed.setTimestamp();
  embed.setURL("https://github.com/hackergiraffe/pewds_bot");
  embed.setTitle("PewdsBot");
  return embed;
};

const commands = [
  {
    command: "check_sub_gap",
    aliases: ["checksubgap", "subgap", "gap"],
    executor: async msg => {
      const { pewdiepie, tseries, difference } = await getStats();
      const embed = createEmbed();
      embed.setDescription(
        `PewDiePie [${humanize(pewdiepie)}] is ${humanize(
          difference
        )} subscribers away from T-Series [${humanize(tseries)}]`
      );
      await msg.channel.send(embed);
    }
  },
  {
    command: "pewdiepie_subs",
    aliases: [
      "pewds_subs",
      "pewdssubs",
      "pewdsubs",
      "pewdiepie",
      "pewds",
      "pewd"
    ],
    executor: async msg => {
      const { pewdiepie } = await getStats();
      const embed = createEmbed();
      embed.setDescription(
        `PewDiePie currently has ${humanize(pewdiepie)} subscribers.`
      );
      await msg.channel.send(embed);
    }
  },
  {
    command: "t-series_subs",
    aliases: ["tseriessubs", "tseries_subs", "t-series", "tseries"],
    executor: async msg => {
      const { tseries } = await getStats();
      const embed = createEmbed();
      embed.setDescription(
        `T-Series currently has ${humanize(tseries)} subscribers.`
      );
      await msg.channel.send(embed);
    }
  }
];

client.on("ready", () => {
  // discord.js ready event
  console.log(chalk.green('[Discord] PewdsBot ready!'));
  client.user.setActivity('Supporting PewDiePie!');
});

client.on("message", async msg => {
  // discord.js message event
  try {
    if (msg.author.bot || msg.author === client.user) return; // Checks if executor is bot/self
	if (!msg.content.startsWith(CONFIG.discord.prefix)) return;
	let cmdTxt = msg.content.substr(CONFIG.discord.prefix.length);
    let cmd = commands.find(item => {
      // Find a command using predicate
      return item.command === cmdTxt || item.aliases.includes(cmdTxt);
    });
    if (!cmd) {
		msg.channel.send('Invalid command.');
		return;
	} // command not found
    await cmd.executor(msg);
  } catch (err) {
    console.error(chalk.red("[Discord] Error in message handler!"), err);
  }
});

client.login(CONFIG.discord.token); // Logs in with Token at CONFIG.discord.token
