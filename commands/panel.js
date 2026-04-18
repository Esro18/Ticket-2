const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('إظهار بانل التذاكر'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام التذاكر')
            .setDescription('اختر نوع التذكرة من الأزرار بالأسفل')
            .setImage(config.panelImage)
            .setColor('#2b2d31');

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rocket').setLabel('روكت ليق').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('fort').setLabel('فورت نايت').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('gta').setLabel('GTA V').setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('roblox').setLabel('روبلوكس').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('cod').setLabel('Call of Duty').setStyle(ButtonStyle.Primary)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('buy').setLabel('شراء حساب').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ask').setLabel('استفسار').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2, row3] });
    }
};