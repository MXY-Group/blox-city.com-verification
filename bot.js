const Discord = require('discord.js');
const axios = require('axios');
const client = new Discord.Client();

client.list = new Discord.Collection();
client.roles = new Discord.Collection();
client.verified = new Discord.Collection();

async function verify(code, user) {
    const res = await axios.get(`https://www.blox-city.com/api/v1/user/info?username=${user}`);
    if(res.data.description.match(code)) {
        const dissy = client.list.find(dis => dis.user.toLowerCase() == res.data.username.toLowerCase());
        dissy.user = res.data.username;
        return true;
    } else {
        return false;
    }
};

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
};

async function fetchuser(user) {
    const res = await axios.get(`https://www.blox-city.com/api/v1/user/info?username=${user}`);
    if (res.data.username) {
        return true;
    } else {
        return false;
    };
};
 
client.on('ready', async () => {
    console.log('Bot has started - Provided by MXY Group(mxy.gg)');
    
    client.user.setActivity(`Send me your username!`, { type: 'WATCHING' });
});

client.on('guildCreate', (guild) => {
    guild.channels.cache.forEach((channel) => {
        if (channel.type == "text" && defaultChannel == "") {
          if (channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
            return channel.send(`Welcome to BC Verification!\nTo configure the verified role please run bc!role @role`)
          }
        }
    })
});

client.on('guildMemberAdd', async (member) => {
    if (client.verified.get(member.user.id)) {
        await client.guilds.cache.get(member.guild.id).members.fetch(member.user.id);
        client.guilds.cache.get(member.guild.id).members.cache.get(member.user.id).roles.add(client.roles.get(guild).role);
        client.guilds.cache.get(member.guild.id).members.cache.get(member.user.id).setNickname(client.verified.get(member.user.id).user);
    }
});
 
client.on('message', async (message) => {
    if (message.author.bot) return;

    if (message.content.match('bc!role') && message.member.hasPermission('ADMINISTRATOR')) {
        var rid = message.content.substring(8).replace(/\D+/g, '');;
        if (message.guild.roles.cache.get(rid)) {
            client.roles.set(message.guild.id, { role: rid });
            message.channel.send(`Role was set!`);
        } else {
            message.channel.send(`Please tag the role by doing @rolename`);
        };
    }

    if (message.channel.type != 'dm') return;

    if (client.list.get(message.channel.id)) {
        if (client.list.get(message.channel.id).guild == 0) {
            const g = client.guilds.cache.find(g => g.name.toLowerCase() == message.content.toLowerCase());
            if (g) {
                client.list.get(message.channel.id).guild = g.id;
                message.channel.send(`Please put the following code in your description: ${client.list.get(message.channel.id).code}\nSay confirm to proceed.`)
            } else {
                message.channel.send(`Please provide the entire server name.`);
            }
        }

        if(message.content == 'confirm') {
            const confirm = await verify(client.list.get(message.channel.id).code, client.list.get(message.channel.id).user);
            if (confirm) {
                const guild = client.list.get(message.channel.id).guild;
                await client.guilds.cache.get(guild).members.fetch(message.author.id);
                client.guilds.cache.get(guild).members.cache.get(message.author.id).roles.add(client.roles.get(guild).role);
                client.guilds.cache.get(guild).members.cache.get(message.author.id).setNickname(client.list.get(message.channel.id).user);
                client.verified.set(message.author.id, { username: client.list.get(message.channel.id).user })
                client.list.delete(message.channel.id);
                message.channel.send(`Verification successful!`);
            } else {
                message.channel.send(`Make sure to put the provided code in the description.\nTo cancel the process say cancel`);
            }
        }

        if (message.content == 'cancel') {
            if(client.list.get(message.channel.id)) {
                client.list.delete(message.channel.id);
                message.channel.send(`Verification was cancelled!\nPlease provide me with a blox-city.com username.`);
            } else {
                message.channel.send(`Sorry, it seems like you are not in the verification process.`);
            }
        }
    } else {
        const finduser = await fetchuser(message.content);
        if (finduser) {
            var code = randomString(5, '0123456789');
            client.list.set(message.channel.id, { user: message.content, code: code, guild: 0 })
            message.channel.send(`Please provide me with the server name.`);
        } else {
            message.channel.send(`${message.content} does not exist!\nPlease provide a valid username.`);
        }
    }
});
 
client.login(process.env.token);
