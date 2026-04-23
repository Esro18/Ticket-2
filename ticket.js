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

        const logsChannel = interaction.guild.channels.cache.get(config.logsChannel);

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

            // لوق فتح التذكرة
            if (logsChannel) {
                logsChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("📘 تم فتح تذكرة جديدة")
                            .setDescription(
                                `👤 **العميل:** <@${interaction.user.id}>\n` +
                                `📂 **القسم:** ${type}\n` +
                                `🔗 **رابط التذكرة:** ${channel.url}`
                            )
                            .setColor("Green")
                    ]
                });
            }

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

                if (logsChannel) {
                    logsChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("📕 تم إغلاق تذكرة")
                                .setDescription(
                                    `👤 **منفذ الإغلاق:** <@${interaction.user.id}>\n` +
                                    `🔗 **رابط التذكرة:** ${interaction.channel.url}`
                                )
                                .setColor("Red")
                        ]
                    });
                }

                await interaction.reply({ content: "سيتم إغلاق التذكرة خلال 5 ثواني", ephemeral: true });
                setTimeout(() => interaction.channel.delete(), 5000);
            }

            // استدعاء الأونر (DM) — تم إصلاحه هنا
            if (interaction.customId === 'call_owner') {

                const ticketType = interaction.channel.parent?.name || "غير معروف";
                const owner = await interaction.guild.members.fetch(config.roles.owner).catch(() => null);

                let sent = false;

                if (owner) {
                    await owner.send(
                        `👑 **تنبيه مهم!**\n` +
                        `تم استدعاؤك من قبل أحد أفراد الطاقم داخل تذكرة.\n\n` +
                        `📂 **قسم التذكرة:** ${ticketType}\n` +
                        `🔗 **رابط التذكرة:** ${interaction.channel.url}\n\n` +
                        `⚠️ يرجى الدخول فورًا.`
                    ).then(() => sent = true)
                     .catch(() => sent = false);
                }

                if (logsChannel) {
                    logsChannel.send(
                        sent
                        ? `👑 تم إرسال استدعاء للأونر بواسطة <@${interaction.user.id}> داخل ${interaction.channel.url}`
                        : `❌ فشل إرسال رسالة للأونر — قد يكون الخاص مقفل`
                    );
                }

                await interaction.reply({
                    content: sent
                        ? "📨 تم إرسال رسالة للأونر في الخاص"
                        : "❌ لم يتمكن البوت من إرسال رسالة للأونر — قد يكون الخاص مقفل",
                    ephemeral: true
                });
            }

            // استدعاء الدعم الفني (يرسل في روم مخصص)
            if (interaction.customId === 'call_support') {

                const supportChannel = interaction.guild.channels.cache.get(config.supportCallChannel);
                if (!supportChannel)
                    return interaction.reply({ content: "روم استدعاء الدعم غير موجود", ephemeral: true });

                await supportChannel.send(
                    `<@&${config.roles.support}> لديك استدعاء داخل التذكرة\n` +
                    `🔗 **رابط التذكرة:** ${interaction.channel.url}`
                );

                if (logsChannel) {
                    logsChannel.send(`🛠️ تم استدعاء الدعم الفني بواسطة <@${interaction.user.id}> داخل ${interaction.channel.url}`);
                }

                await interaction.reply({ content: "📨 تم إرسال الاستدعاء في روم الدعم الفني", ephemeral: true });
            }

            // استدعاء العميل (DM)
            if (interaction.customId === 'call_client') {

                const ticketOwner = interaction.channel.permissionOverwrites.cache
                    .find(p => p.allow.has(PermissionFlagsBits.SendMessages) && p.type === 1)?.id;

                if (!ticketOwner)
                    return interaction.reply({ content: "لم يتم العثور على صاحب التذكرة", ephemeral: true });

                const user = await interaction.guild.members.fetch(ticketOwner).catch(() => null);
                if (!user)
                    return interaction.reply({ content: "لا يمكن إرسال رسالة للعميل", ephemeral: true });

                const ticketType = interaction.channel.parent?.name || "غير معروف";

                await user.send(
                    `📩 **لديك استدعاء من الطاقم!**\n\n` +
                    `🪪 **قسم التذكرة:** ${ticketType}\n` +
                    `🔗 **رابط التذكرة:** ${interaction.channel.url}`
                ).catch(() => null);

                if (logsChannel) {
                    logsChannel.send(`📩 تم استدعاء العميل بواسطة <@${interaction.user.id}> داخل ${interaction.channel.url}`);
                }

                await interaction.reply({ content: "📨 تم إرسال رسالة للعميل في الخاص", ephemeral: true });
            }
        }
    }
};