const cron = require('node-cron');
const {
    SendJobs
} = require('./Bots/Telegram/DoStuff');
const {
    GetAll
} = require('./AIO');
const dotenv = require('dotenv');
dotenv.config();


if (process.env.UPDATE_DB === 'true') {
    console.log('Update DB');
    GetAll().then(data => {
        console.log('Update DB done');
    });
}

let count = 0;
cron.schedule('0 */6 * * *', () => {
    console.log('cron job count: ', count++ + ', ' + new Date());
    GetAll().then(async (result) => {
        if (result.length != 0) {
            await SendJobs(result)
        }
        throw Error('result is empty')
    }).catch((e) => {
        console.log(e);
    });
});