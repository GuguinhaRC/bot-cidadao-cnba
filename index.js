require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits
} = require('discord.js');

const { getRobloxAvatar } = require('./services/roblox');
const { gerarRG } = require('./utils/gerarRG');

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
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
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
    },
    {
      name: 'roblox',
      description: 'Username do Roblox',
      type: 3,
      required: true
    }
  ]
};

/* =========================
   REGISTER COMMAND
========================= */

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comando /registrar_rg...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [rgCommand] }
    );

    console.log('✅ Comando /registrar_rg registrado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comando:', error);
  }
})();

/* =========================
   INTERACTION
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

  await interaction.deferReply();

  const nome = interaction.options.getString('nome');
  const idade = interaction.options.getInteger('idade');
  const profissao = interaction.options.getString('profissao');
  const nacionalidade = interaction.options.getString('nacionalidade');
  const robloxUser = interaction.options.getString('roblox');

  // 🎮 Avatar Roblox
  const avatarUrl = await getRobloxAvatar(robloxUser);
  if (!avatarUrl) {
    return interaction.editReply('❌ Usuário do Roblox não encontrado.');
  }

  // 🆔 Número de RG RP
  const rgNumero = Math.floor(100000 + Math.random() * 900000);

  // 🎨 Gerar imagem do RG
  const rgImage = await gerarRG({
    nome,
    idade,
    profissao,
    nacionalidade,
    rg: rgNumero,
    avatar: avatarUrl
  });

  // 📤 Enviar RG
  await interaction.editReply({
    content: '🆔 **RG RP GERADO COM SUCESSO**',
    files: [
      {
        attachment: rgImage,
        name: 'rg-rp.png'
      }
    ]
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
