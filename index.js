require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createCanvas, loadImage } = require('canvas');
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');

/* ===============================
   🤖 CLIENT
================================ */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

/* ===============================
   💾 BANCO DE DADOS (RG PERMANENTE)
================================ */
const db = new sqlite3.Database('./database.sqlite');

db.run(`
CREATE TABLE IF NOT EXISTS rgs (
  userId TEXT PRIMARY KEY,
  nome TEXT,
  idade INTEGER,
  profissao TEXT,
  nacionalidade TEXT,
  roblox TEXT,
  status TEXT
)
`);

/* ===============================
   🧩 COMMANDS INLINE (SEM PASTA)
================================ */
const slashCommands = [
  {
    name: 'criar_rg',
    description: 'Criar seu RG RP',
    options: [
      { name: 'nome', type: 3, required: true },
      { name: 'idade', type: 4, required: true },
      { name: 'profissao', type: 3, required: true },
      { name: 'nacionalidade', type: 3, required: true },
      { name: 'roblox', type: 3, required: true }
    ]
  },
  {
    name: 'alterar_status',
    description: 'Alterar status criminal',
    options: [
      { name: 'cidadao', type: 6, required: true },
      {
        name: 'status',
        type: 3,
        required: true,
        choices: [
          { name: '🟢 Limpo', value: 'limpo' },
          { name: '🔴 Procurado', value: 'procurado' },
          { name: '⚫ Preso', value: 'preso' }
        ]
      }
    ]
  }
];

/* ===============================
   🚀 REGISTRAR SLASH
================================ */
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: slashCommands }
  );
  console.log('✅ Comandos registrados');
})();

/* ===============================
   🖼️ GERAR IMAGEM RG
================================ */
async function gerarRG(dados, avatarURL) {
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext('2d');

  const base = await loadImage('./src/assets/rg_base.png');
  ctx.drawImage(base, 0, 0, 800, 500);

  const avatar = await loadImage(avatarURL);
  ctx.drawImage(avatar, 40, 120, 150, 150);

  ctx.fillStyle = '#000';
  ctx.font = '20px Arial';

  ctx.fillText(`Nome: ${dados.nome}`, 220, 160);
  ctx.fillText(`Idade: ${dados.idade}`, 220, 200);
  ctx.fillText(`Profissão: ${dados.profissao}`, 220, 240);
  ctx.fillText(`Nacionalidade: ${dados.nacionalidade}`, 220, 280);
  ctx.fillText(`Roblox: ${dados.roblox}`, 220, 320);
  ctx.fillText(`Status: ${dados.status.toUpperCase()}`, 220, 360);

  if (dados.status === 'procurado') {
    const selo = await loadImage('./src/assets/selo_procurado.png');
    ctx.drawImage(selo, 500, 50, 250, 250);
  }

  return canvas.toBuffer();
}

/* ===============================
   🎮 INTERACTIONS
================================ */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const POLICE_ROLE_ID = process.env.POLICE_ROLE_ID;

  /* ===============================
     👤 CRIAR RG (CIDADÃO)
  ================================ */
  if (interaction.commandName === 'criar_rg') {
    db.get(
      `SELECT * FROM rgs WHERE userId = ?`,
      [interaction.user.id],
      async (err, row) => {
        if (row) {
          return interaction.reply({
            content: '🚫 Você já possui um RG registrado.',
            ephemeral: true
          });
        }

        const dados = {
          userId: interaction.user.id,
          nome: interaction.options.getString('nome'),
          idade: interaction.options.getInteger('idade'),
          profissao: interaction.options.getString('profissao'),
          nacionalidade: interaction.options.getString('nacionalidade'),
          roblox: interaction.options.getString('roblox'),
          status: 'limpo'
        };

        db.run(
          `INSERT INTO rgs VALUES (?, ?, ?, ?, ?, ?, ?)`,
          Object.values(dados)
        );

        const buffer = await gerarRG(
          dados,
          interaction.user.displayAvatarURL({ extension: 'png' })
        );

        const file = new AttachmentBuilder(buffer, { name: 'rg.png' });

        const embed = new EmbedBuilder()
          .setTitle('🆔 RG RP — CONEXÃO BAHIA')
          .setColor('#0A3D62')
          .setImage('attachment://rg.png')
          .setFooter({ text: 'Sistema Oficial RP' });

        interaction.reply({ embeds: [embed], files: [file] });
      }
    );
  }

  /* ===============================
     👮 ALTERAR STATUS (POLÍCIA)
  ================================ */
  if (interaction.commandName === 'alterar_status') {
    if (!interaction.member.roles.cache.has(POLICE_ROLE_ID)) {
      return interaction.reply({
        content: '🚫 Apenas policiais.',
        ephemeral: true
      });
    }

    const cidadao = interaction.options.getUser('cidadao');
    const status = interaction.options.getString('status');

    db.run(
      `UPDATE rgs SET status = ? WHERE userId = ?`,
      [status, cidadao.id]
    );

    interaction.reply(
      `⚖️ Status de **${cidadao.tag}** alterado para **${status.toUpperCase()}**`
    );
  }
});

/* ===============================
   🔐 LOGIN
================================ */
client.once('ready', () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
