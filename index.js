require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes
} = require('discord.js');

/* =========================
   CLIENT
========================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.commands = new Collection();

/* =========================
   LOAD COMMANDS (SUBPASTAS)
========================= */

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);

  if (fs.statSync(folderPath).isDirectory()) {
    const commandFiles = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      // 🔥 SUPORTE A ARRAY DE COMMANDS
      if (Array.isArray(command)) {
        for (const cmd of command) {
          client.commands.set(cmd.name, cmd);
          commands.push(cmd.toJSON());
        }
      } else {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      }
    }
  }
}

/* =========================
   REGISTER SLASH COMMANDS
========================= */

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos slash...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();

/* =========================
   INTERACTIONS
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // Caso seja array-style (seus commands atuais)
    if (command.execute) {
      await command.execute(interaction);
    } else {
      await interaction.reply({
        content: '⚠️ Este comando ainda não possui execução.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '❌ Ocorreu um erro ao executar este comando.',
      ephemeral: true
    });
  }
});

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
