// ===============================
// 🤖 BOT CIDADÃO RP - INDEX FINAL
// ===============================

// 🔹 Imports
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  AttachmentBuilder,
  EmbedBuilder
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

// ===============================
// 🔹 CLIENT
// ===============================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===============================
// 🔹 BANCO DE DADOS (JSON)
// ===============================
const dbPath = path.join(__dirname, "database", "rg.json");

function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ===============================
// 🔹 COMANDOS SLASH
// ===============================
const commands = [
  new SlashCommandBuilder()
    .setName("criar_rg")
    .setDescription("📄 Criar seu RG RP")
    .addStringOption(o => o.setName("nome").setDescription("Nome RP").setRequired(true))
    .addIntegerOption(o => o.setName("idade").setDescription("Idade").setRequired(true))
    .addStringOption(o => o.setName("profissao").setDescription("Profissão").setRequired(true))
    .addStringOption(o => o.setName("nacionalidade").setDescription("Nacionalidade").setRequired(true))
    .addStringOption(o => o.setName("roblox").setDescription("Nome do personagem Roblox").setRequired(true)),

  new SlashCommandBuilder()
    .setName("status_rg")
    .setDescription("🚨 Alterar status do RG (POLÍCIA)")
    .addUserOption(o => o.setName("cidadao").setDescription("Cidadão").setRequired(true))
    .addStringOption(o =>
      o.setName("status")
        .setDescription("Novo status")
        .setRequired(true)
        .addChoices(
          { name: "Limpo", value: "LIMPO" },
          { name: "Procurado", value: "PROCURADO" },
          { name: "Preso", value: "PRESO" }
        )
    )
].map(cmd => cmd.toJSON());

// ===============================
// 🔹 REGISTRAR COMANDOS
// ===============================
client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

// ===============================
// 🔹 INTERAÇÕES
// ===============================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const db = loadDB();

  // ===============================
  // 🆔 CRIAR RG
  // ===============================
  if (interaction.commandName === "criar_rg") {
    await interaction.deferReply(); // 🔥 ESSENCIAL

    const userId = interaction.user.id;

    if (db[userId]) {
      return interaction.editReply({
        content: "❌ Você já possui um RG registrado."
      });
    }

    const nome = interaction.options.getString("nome");
    const idade = interaction.options.getInteger("idade");
    const profissao = interaction.options.getString("profissao");
    const nacionalidade = interaction.options.getString("nacionalidade");
    const roblox = interaction.options.getString("roblox");

    const rgNumero = Math.floor(100000 + Math.random() * 900000);

    db[userId] = {
      nome,
      idade,
      profissao,
      nacionalidade,
      roblox,
      rg: rgNumero,
      status: "LIMPO"
    };

    saveDB(db);

    const image = await gerarRG(
      db[userId],
      interaction.user.displayAvatarURL({ extension: "png" })
    );

    const attachment = new AttachmentBuilder(image, { name: "rg.png" });

    await interaction.editReply({
      content: "✅ **RG RP criado com sucesso!**",
      files: [attachment]
    });
  }

  // ===============================
  // 🚨 STATUS RG (POLÍCIA)
  // ===============================
  if (interaction.commandName === "status_rg") {
    if (!interaction.member.roles.cache.some(r => r.name.toLowerCase().includes("policia"))) {
      return interaction.reply({ content: "❌ Apenas policiais.", ephemeral: true });
    }

    const user = interaction.options.getUser("cidadao");
    const status = interaction.options.getString("status");

    if (!db[user.id]) {
      return interaction.reply({ content: "❌ RG não encontrado.", ephemeral: true });
    }

    db[user.id].status = status;
    saveDB(db);

    await interaction.reply(`🚨 Status do RG alterado para **${status}**`);
  }
});

// ===============================
// 🎨 GERAR IMAGEM RG
// ===============================
async function gerarRG(data, avatarURL) {
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext("2d");

  const base = await loadImage(path.join(__dirname, "assets", "rg_base.png"));
  ctx.drawImage(base, 0, 0, 800, 500);

  const avatar = await loadImage(avatarURL);
  ctx.drawImage(avatar, 40, 120, 150, 150);

  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText(`Nome: ${data.nome}`, 220, 160);
  ctx.fillText(`Idade: ${data.idade}`, 220, 190);
  ctx.fillText(`Profissão: ${data.profissao}`, 220, 220);
  ctx.fillText(`Nacionalidade: ${data.nacionalidade}`, 220, 250);
  ctx.fillText(`RG: ${data.rg}`, 220, 280);
  ctx.fillText(`Status: ${data.status}`, 220, 310);

  if (data.status === "PROCURADO") {
    ctx.fillStyle = "rgba(255,0,0,0.7)";
    ctx.font = "bold 60px Arial";
    ctx.fillText("PROCURADO", 200, 430);
  }

  return canvas.toBuffer();
}

// ===============================
// 🔹 LOGIN
// ===============================
client.login(process.env.DISCORD_TOKEN);
