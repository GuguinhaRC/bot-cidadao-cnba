// ===============================
// 🤖 BOT CIDADÃO RP - RG EM EMBED
// ===============================

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

// ===============================
// 🔹 CLIENT
// ===============================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===============================
// 🔹 BANCO DE DADOS
// ===============================
const dbPath = path.join(__dirname, "database", "rg.json");

function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
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
].map(c => c.toJSON());

// ===============================
// 🔹 REGISTRAR COMANDOS
// ===============================
client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Comandos registrados");
});

// ===============================
// 🔹 INTERAÇÕES
// ===============================
client.on("interactionCreate", async interaction => {

  // 🔥 LOG DE VIDA (DEBUG)
  console.log("INTERAÇÃO RECEBIDA:", interaction.commandName);

  try {
    if (!interaction.isChatInputCommand()) return;

    const db = loadDB();

    // ===============================
    // 🆔 CRIAR RG
    // ===============================
    if (interaction.commandName === "criar_rg") {
      await interaction.deferReply();

      const userId = interaction.user.id;

      if (db[userId]) {
        return interaction.editReply("❌ Você já possui um RG registrado.");
      }

      const data = {
        nome: interaction.options.getString("nome"),
        idade: interaction.options.getInteger("idade"),
        profissao: interaction.options.getString("profissao"),
        nacionalidade: interaction.options.getString("nacionalidade"),
        roblox: interaction.options.getString("roblox"),
        rg: Math.floor(100000 + Math.random() * 900000),
        status: "LIMPO"
      };

      db[userId] = data;
      saveDB(db);

      const embed = new EmbedBuilder()
        .setTitle("🆔 REGISTRO GERAL — CIDADÃO RP")
        .setColor(0x1e90ff)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: "👤 Nome", value: data.nome, inline: true },
          { name: "🎂 Idade", value: String(data.idade), inline: true },
          { name: "💼 Profissão", value: data.profissao, inline: true },
          { name: "🌎 Nacionalidade", value: data.nacionalidade, inline: true },
          { name: "🎮 Roblox", value: data.roblox, inline: true },
          { name: "🆔 Número do RG", value: String(data.rg), inline: true },
          { name: "🚨 Status", value: data.status, inline: true }
        )
        .setFooter({ text: "Sistema de Identidade RP" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    // ===============================
    // 🚨 STATUS RG
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

      await interaction.reply(`🚨 Status do RG de ${user} alterado para **${status}**`);
    }

  } catch (err) {
    console.error("ERRO:", err);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("❌ Erro interno do bot.");
    } else {
      await interaction.reply({ content: "❌ Erro interno do bot.", ephemeral: true });
    }
  }
});

// ===============================
// 🔹 LOGIN
// ===============================
client.login(process.env.DISCORD_TOKEN);
