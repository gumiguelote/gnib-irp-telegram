const dotenv = require("dotenv");
dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const INTERVAL_REQUEST_IN_SECONDS = process.env.INTERVAL_REQUEST_IN_SECONDS;
const CHAT_ID = process.env.CHAT_ID;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
var content = "";

app.listen(PORT, () => {
  checkAppointments();
  startCommandsBotEvent();
});

app.get("/", (req, res) => {
  res.send(`<script>
  setTimeout(() => {
    window.location.reload()
  }, 5000)
  </script> ${content}`);
});

const checkAppointments = () => {
  setInterval(async () => {
    try {
      const { data } = await axios.get(`${process.env.APPOINTMENTS_ENDPOINT}`);
      const isEmpty = JSON.stringify(data) === '{"empty":"TRUE"}';
      if (!isEmpty) {
        content += `${returnTimeStamp()} - 
          <a 
            href="https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm">
            Appointment Found!
          </a>
        <br>`;
        bot.sendMessage(
          CHAT_ID,
          ` Appointment Found!
            https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm
            `
        );
      }
      content += `Request -> ${returnTimeStamp()} - Nothing found <br>`;
    } catch (error) {
      content += `Request -> ${returnTimeStamp()} - ${error} <br>`;
      bot.sendMessage(CHAT_ID, `${error}`);
    }
  }, INTERVAL_REQUEST_IN_SECONDS * 1000);
};

const returnTimeStamp = () => {
  return `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`;
};

const startCommandsBotEvent = () => {
  bot.onText(/\/start (.+)/, (msg, match) => {
    switch (match[1]) {
      case "myid":
        bot.sendMessage(CHAT_ID, msg.chat.id);
        break;
      case "viewcontent":
        bot.sendMessage(CHAT_ID, content);
        break;
      case "clearcontent":
        content = "";
        bot.sendMessage(CHAT_ID, "Cleared");
        break;
      case "irpsite":
        bot.sendMessage(
          CHAT_ID,
          "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm"
        );
        break;
      default:
        bot.sendMessage(CHAT_ID, "Invalid command");
    }
  });

  bot.onText(/\/help/, (msg, match) => {
    const commands = `
/start myid  -> Show chat_id
/start irpsite  -> Return IRP-GNIB Form (site)
/start viewcontent -> Show log
/start clearcontent -> Clear log from memory`;
    bot.sendMessage(CHAT_ID, commands);
  });
};
