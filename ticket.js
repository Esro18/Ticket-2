const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('./config.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        if (!interaction.isButton()) return;

        // زر فتح التذكرة
        const types = ["rocket", "fort", "gta", "roblox", "cod", "buy", "ask"];

        if (types.includes(interaction.customId)) {

            const categoryId = config.ticketCategories[interaction.customId];
            const staffRole = config.roles[interaction.customId];
            const controlRole = config.roles.control;

            if (!categoryId) 
                return interaction.reply({ content: "كاتيجوري هذا القسم غير موجود في config.json", ephemeral: true });

            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: 0,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: staffRole,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: controlRole,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle("🎫 تم فتح تذكرتك")
                .setDescription("سيتم خدمتك قريباً من قبل الطاقم المختص")
                .setColor("#2b2d31");

            await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });
            await interaction.reply({ content: "تم إنشاء تذكرتك بنجاح", ephemeral: true });
        }
    }
};