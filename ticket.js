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
                topic: `OWNER:${interaction.user.id}`,
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
                    .setCustomId('take_ticket')
                    .setLabel('🟢 استلام التذكرة')
                    .setStyle(ButtonStyle.Success),

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
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
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

            // زر استلام التذكرة
            if (interaction.customId === 'take_ticket') {

                const controlRole = config.roles.control;

                if (!interaction.member.roles.cache.has(controlRole)) {
                    return interaction.reply({
                        content: "❌ ليس لديك صلاحية استلام التذكرة.",
                        ephemeral: true
                    });
                }

                if (interaction.channel.topic.includes("TAKEN")) {
                    return interaction.reply({
                        content: "⚠️ تم استلام التذكرة مسبقًا.",
                        ephemeral: true
                    });
                }

                await interaction.channel.setTopic(interaction.channel.topic + " | TAKEN");

                await interaction.reply({
                    content: `🟢 **تم استلام التذكرة بواسطة <@${interaction.user.id}>**`,
                });

                if (logsChannel) {
                    logsChannel.send(
                        `🟢 **تم استلام التذكرة** بواسطة <@${interaction.user.id}> داخل ${interaction.channel.url}`
                    );
                }

                const updatedButtons = new ActionRowBuilder().addComponents(
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
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 إغلاق التذكرة')
                        .setStyle(ButtonStyle.Danger)
                );

                await interaction.message.edit({
                    components: [updatedButtons]
                });
            }

            // استدعاء الأونر (DM) — النسخة القصيرة المضمونة
            if (interaction.customId === 'call_owner') {

                const ticketType = interaction.channel.parent?.name || "غير معروف";
                const owner = await interaction.guild.members.fetch(config.roles.owner).catch(() => null);

                let sent = false;

                if (owner) {
                    await owner.send(
                        `👑 تم طلب حضورك داخل التذكرة.\n\n` +
                        `📂 القسم: ${ticketType}\n` +
                        `🔗 الرابط: ${interaction.channel.url}`
                    ).then(() => sent = true)
                     .catch(() => sent = false);
                }

                if (logsChannel) {
                    logsChannel.send(
                        sent
                        ? `👑 تم إرسال استدعاء للأونر بواسطة <@${interaction.user.id}> داخل ${interaction.channel.url}`
                        : `❌ فشل إرسال رسالة للأونر — الخاص مقفل أو الرسالة مرفوضة`
                    );
                }

                await interaction.reply({
                    content: sent
                        ? "📨 تم إرسال رسالة للأونر في الخاص"
                        : "❌ لم يتمكن البوت من إرسال رسالة للأونر",
                    ephemeral: true
                });
            }

            // استدعاء الدعم الفني
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

            // استدعاء العميل
            if (interaction.customId === 'call_client') {

                const ticketOwner = interaction.channel.topic?.split("OWNER:")[1]?.split(" ")[0];

                if (!ticketOwner)
                    return interaction.reply({ content: "لم يتم العثور على صاحب التذكرة", ephemeral: true });

                const user = await interaction.guild.members.fetch(ticketOwner).catch(() => null);
                if (!user)
                    return interaction.reply({ content: "لا يمكن إرسال رسالة للعميل", ephemeral: true });

                const ticketType = interaction.channel.parent?.name || "غير معروف";

                await user.send(
                    `📩 لديك استدعاء من الطاقم.\n\n` +
                    `📂 القسم: ${ticketType}\n` +
                    `🔗 الرابط: ${interaction.channel.url}`
                ).catch(() => null);

                if (logsChannel) {
                    logsChannel.send(`📩 تم استدعاء العميل بواسطة <@${interaction.user.id}> داخل ${interaction.channel.url}`);
                }

                await interaction.reply({ content: "📨 تم إرسال رسالة للعميل في الخاص", ephemeral: true });
            }

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
        }
    }
};