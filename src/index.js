const http = require('http');
http.createServer(function(_, res) {
  res.write('ready');
  res.end();
}).listen(8080);
const Discord = require('discord.js');
const { Client, Intents } = Discord;
const { PermissionFlagsBits: Permissions } = require('discord-api-types/v9');
const client = new Client({
  intents: Object.keys(Intents.FLAGS),
});

client.on('ready', async () => {
  console.log('ready');
  (await client.channels
    .resolve('924906521194799134')
    .messages
    .fetch('924939341317431336')
  ).edit({
    components: parse(
      slice(Object.entries(Permissions), 25)
    ),
  });
});

client.on('interactionCreate', async interaction => {
  const {
    customId,
    values,
    guild,
    message
  } = interaction;
  const [id, index] = customId.match(/^list_(\d+)$/);
  if (index + 1) {
    let bits = values.length ?
    values.reduce((x, y) => BigInt(x) + BigInt(y)) : 0n;
    bits = bits.toString(2)
      .padStart(25 * message.components.length, '0')
      .match(/[01]{1,25}/gy)
      .reverse();
    const role = guild.roles
      .resolve('909001352166899752');
    const permissions = role.permissions
      .bitfield.toString(2)
      .padStart(25 * message.components.length, '0')
      .match(/[01]{1,25}/gy)
      .reverse();
    permissions.splice(index, 1, bits[index]);
    const {
      permissions: { bitfield }
    } = await role.setPermissions(
      BigInt(
        '0b' + permissions.reverse().join('')
      )
    );
    interaction.reply({
      content: id + '```\n' + [
        bits.reverse() + '',
        permissions + '',
        bitfield.toString(2)
        .padStart(25 * message.components.length, '0')
        .match(/[01]{1,25}/gy) + '',
      ].join('\n') + '```',
      ephemeral: true
    });
  }
});

client.login(process.env.token);

function slice(array, number) {
  const length = Math.ceil(array.length / number);
  return new Array(length).fill().map((_, i) =>
    array.slice(i * number, (i + 1) * number)
  );
}

function parse(source) {
  return source.map((perms, i) => ({
    type: 1,
    components: [{
      type: 3,
      custom_id: 'list_' + i,
      min_values: 0,
      max_values: Math.min(25, source[i].length),
      placeholder: 'Select necessary permissions',
      options: perms.map(
        ([key, value]) => ({
          label: key,
          value: String(value),
        })
      ),
    }]
  }));
}
