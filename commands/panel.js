const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder 
} = require('discord.js');

const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('إظهار بانل التذاكر'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('نظام التذاكر | Ticket System')
            .setDescription('اختر نوع التذكرة من القائمة بالأسفل\nChoose the ticket type from the menu below')
            .setImage(config.panelImage)
            .setColor('#2b2d31');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('اختر نوع التذكرة | Choose ticket type')
                .addOptions(
                    {
                        label: 'روكيت ليق | Rocket League',
                        value: 'rocket'
                    },
                    {
                        label: 'فورتنايت | Fortnite',
                        value: 'fort'
                    },
                    {
                        label: 'جاتا ٥ | GTA V',
                        value: 'gta'
                    },
                    {
                        label: 'روبلوكس | Roblox',
                        value: 'roblox'
                    },
                    {
                        label: 'كول أوف ديوتي | Call of Duty',
                        value: 'cod'
                    },
                    {
                        label: 'شراء حساب | Account Purchase',
                        value: 'buy'
                    },
                    {
                        label: 'استفسار | Inquiry',
                        value: 'ask'
                    }
                )
        );

        await interaction.reply({ embeds: [embed], components: [menu] });
    }
};