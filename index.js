require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits
} = require('discord.js');

/* =========================
   CLIENT
========================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =========================
   SLASH COMMAND RG
========================= */

const rgCommand = {
  name: 'registrar_rg',
  description: 'Registrar RG RP (uso exclusivo da polícia)',
  options: [
    {
      name: 'nome',
      description: 'Nome completo RP',
      type: 3,
      required: true
    },
    {
      name: 'idade',
      description: 'Idade RP',
      type: 4,
      required: true
    },
    {
      name: 'profissao',
      description: 'Profissão RP',
      type: 3,
      required: true
    },
    {
      name: 'nacionalidade',
      description: 'Nacionalidade RP',
      type: 3,
      required: true
    }
  ],
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

/* =========================
   REGISTER COMMAND
========================= */

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comando de RG...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [rgCommand] }
    );

    console.log('✅ Comando /registrar_rg registrado!');
  } catch (error) {
    console.error('❌ Erro ao registrar comando RG:', error);
  }
})();

/* =========================
   EXECUTION
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'registrar_rg') return;

  // 🔒 Permissão RP (cargo polícia)
  const policeRoleId = process.env.POLICE_ROLE_ID;
  if (!interaction.member.roles.cache.has(policeRoleId)) {
    return interaction.reply({
      content: '🚫 Apenas policiais podem registrar RG.',
      ephemeral: true
    });
  }

  const nome = interaction.options.getString('nome');
  const idade = interaction.options.getInteger('idade');
  const profissao = interaction.options.getString('profissao');
  const nacionalidade = interaction.options.getString('nacionalidade');

  // 📄 Resposta temporária (imagem vem depois)
  await interaction.reply({
    content:
      `🆔 **RG RP REGISTRADO**\n\n` +
      `👤 Nome: ${nome}\n` +
      `🎂 Idade: ${idade}\n` +
      `💼 Profissão: ${profissao}\n` +
      `🌎 Nacionalidade: ${nacionalidade}\n\n` +
      `📌 *Em breve: RG em imagem (Bahia / Brasil)*`,
    ephemeral: false
  });
});

/* =========================
   READY
========================= */

client.once('ready', () => {
  console.log(`🤖 Sistema de RG online como ${client.user.tag}`);
});

/* =========================
   LOGIN
========================= */

client.login(process.env.TOKEN);
