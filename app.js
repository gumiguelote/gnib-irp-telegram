const dotenv = require("dotenv");
dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT;
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

var chatId = "";

bot.on("message", (msg) => {
  chatId = msg.chat.id;
});

app.listen(port, () => {
  checkAppointments();
});

const checkAppointments = () => {
  setInterval(async () => {
    if (chatId) {
      try {
        const { data } = await axios.get(
          `${process.env.APPOINTMENTS_ENDPOINT}&_=${Date.now()}`
        );
        const isEmpty = JSON.stringify(data) === '{"empty":"TRUE"}';
        if (!isEmpty) {
          bot.sendMessage(
            chatId,
            `Agendamento encontrado!
            Corre clicar no link
            https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm
            `
          );
        }
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `${error}`);
      }
    }
  }, 10000);
};
