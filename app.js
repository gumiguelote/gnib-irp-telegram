const fs = require("fs");
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

app.listen(PORT, () => {
  checkAppointments();
  startCommandsBotEvent();
  schedulePeriodicReports();
  saveLog(`Started - ${returnTimeStamp()}`);
});

const checkAppointments = () => {
  setInterval(async () => {
    try {
      const { data } = await axios.get(`${process.env.APPOINTMENTS_ENDPOINT}`);
      const isEmpty = JSON.stringify(data) === '{"empty":"TRUE"}';
      if (!isEmpty) {
        saveLog(`${returnTimeStamp()} - 
          https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm
          Appointment Found!`);
        bot.sendMessage(
          CHAT_ID,
          `Appointment Found!
            https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm
            `
        );
      }
      saveLog(`Request -> ${returnTimeStamp()} - Nothing found`);
    } catch (error) {
      saveLog(`Request -> ${returnTimeStamp()} - ${error}`);
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
      case "report":
        bot.sendDocument(CHAT_ID, "./reports/report.txt");
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
/start report -> Show report file`;
    bot.sendMessage(CHAT_ID, commands);
  });
};

const saveLog = (data) => {
  fs.appendFile("./reports/report.txt", `${data}\n`, function (err) {
    if (err) throw err;
    console.log("File is created successfully.");
  });
};

const schedulePeriodicReports = () => {
  setInterval(async () => {
    bot.sendDocument(CHAT_ID, "./reports/report.txt");
  }, 600 * 1000);
};
