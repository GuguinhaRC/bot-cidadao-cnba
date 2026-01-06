require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes
} = require('discord.js');

/* =========================
   CLIENT
========================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =========================
   LOAD SLASH COMMANDS
========================= */

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);

  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const exported = require(filePath);

    // 👇 SEU CASO: EXPORTA ARRAY
    if (Array.isArray(exported)) {
      for (const cmd of exported) {
        commands.push(cmd.toJSON());
      }
    }
  }
}

/* =========================
   REGISTER COMMANDS
========================= */

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos slash...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`✅ ${commands.length} comandos registrados com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();

/* =========================
   READY
========================= */

client.once('ready', () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

/* =========================
   LOGIN
========================= */

client.login(process.env.TOKEN);
