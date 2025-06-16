// modbus_dev.js
// const db_opt = require('./lib/db_opt');
module.exports = {
    dev2cmd: async function (dev) {
        // 记录设备发送的指令
        return "01 03 00 00 00 01"
    },
    reply2dev: async function (reply, dev) {
        //记录回复
        console.log(`设备 ${dev.id}: 发出的指令是${reply.toString('hex')}`);
    },
    error2dev: async function (err_msg, dev) {
        //记录错误日志
        console.error(`设备 ${dev.id}:异常是 ${err_msg}`);
    }
};