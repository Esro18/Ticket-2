const { 
    Events, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

const config = require('./config.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // استقبال المنيو
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {

            const type = interaction.values[0];

            const categoryId = config.ticketCategories[type];
            const staffRole = config.roles[type];
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

            // أزرار التحكم
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId('call_owner')
                    .setLabel('👑 استدعاء الأونر')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('call_support')
                    .setLabel('🛠️ استدعاء الدعم الفني')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('call_client')
                    .setLabel('📩 استدعاء العميل')
                    .setStyle(ButtonStyle.Secondary)
            );

            const embed = new EmbedBuilder()
                .setTitle("🎫 تم فتح تذكرتك")
                .setDescription("سيتم خدمتك قريباً من قبل الطاقم المختص")
                .setColor("#2b2d31");

            await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [buttons] });
            await interaction.reply({ content: "تم إنشاء تذكرتك بنجاح", ephemeral: true });
        }

        // استقبال أزرار التحكم
        if (interaction.isButton()) {

            // إغلاق التذكرة
            if (interaction.customId === 'close_ticket') {
                await interaction.reply({ content: "سيتم إغلاق التذكرة خلال 5 ثواني", ephemeral: true });
                setTimeout(() => interaction.channel.delete(), 5000);
            }

            // استدعاء الأونر
            if (interaction.customId === 'call_owner') {
                await interaction.reply({ content: `<@${config.roles.owner}> تم استدعاء الأونر`, ephemeral: false });
            }

            // استدعاء الدعم الفني
            if (interaction.customId === 'call_support') {
                await interaction.reply({ content: `<@${config.roles.support}> تم استدعاء الدعم الفني`, ephemeral: false });
            }

            // استدعاء العميل (DM)
            if (interaction.customId === 'call_client') {

                // استخراج صاحب التذكرة من الصلاحيات
                const ticketOwner = interaction.channel.permissionOverwrites.cache
                    .find(p => p.allow.has(PermissionFlagsBits.SendMessages) && p.type === 1)?.id;

                if (!ticketOwner)
                    return interaction.reply({ content: "لم يتم العثور على صاحب التذكرة", ephemeral: true });

                const user = await interaction.guild.members.fetch(ticketOwner).catch(() => null);
                if (!user)
                    return interaction.reply({ content: "لا يمكن إرسال رسالة للعميل", ephemeral: true });

                // تحديد القسم من اسم الكاتيجوري
                const ticketType = interaction.channel.parent?.name || "غير معروف";

                // إرسال رسالة خاصة للعميل
                await user.send({
                    content:
                        `📩 **لديك استدعاء من الطاقم!**\n\n` +
                        `🪪 **قسم التذكرة:** ${ticketType}\n` +
                        `🔗 **رابط التذكرة:** ${interaction.channel.url}\n\n` +
                        `الرجاء الدخول للتذكرة والرد على الطاقم.`
                }).catch(() => null);

                await interaction.reply({ content: "📨 تم إرسال رسالة للعميل في الخاص", ephemeral: true });
            }
        }
    }
};