const ModbusPDU = require('modbus-pdu')
const crc = require('crc');
const db_opt = require('../../lib/db_opt')
function make_req(fn, address, value, slaver_id) {
    let pdu_data = null;
    if (fn == 3) {
        pdu_data = ModbusPDU.ReadHoldingRegisters.Request.build(address, 1);
    } else if (fn == 5) {
        pdu_data = ModbusPDU.WriteSingleCoil.Request.build(address, value);
    }
    let frame = Buffer.concat([
        Buffer.from([slaver_id]),
        pdu_data,
    ]);

    let frameWithCRC = Buffer.alloc(frame.length + 2);
    frame.copy(frameWithCRC, 0);

    frameWithCRC.writeUInt16LE(crc.crc16modbus(frame), frame.length);
    return frameWithCRC;
};
function parse_reply(reply, data_type, slaver_id) {
    let ret;
    let reply_buffer = Buffer.from(reply);
    if (reply_buffer[0] == slaver_id) {
        let data_length = reply_buffer[2];
        if (data_type == 'uint32' && data_length == 4) {
            ret = reply_buffer.readUInt32LE(3);
            console.log(ret.toString(16));

        }
    }

    return ret;
}

function get_slave_id(device) {
    let ck = JSON.parse(device.connection_key);
    return ck.slaver_id || 0x01; // 默认从站ID为1
}
function hexStringToUint8Array(hexString) {
    // 移除字符串中的空格（如果有），并转为小写（可选）
    const cleanedHex = hexString.replace(/\s/g, '').toLowerCase();

    // 验证是否为有效的十六进制字符串
    if (!/^[0-9a-f]*$/i.test(cleanedHex)) {
        throw new Error('输入包含非十六进制字符');
    }

    // 处理奇数长度：在开头补零
    const paddedHex = cleanedHex.length % 2 !== 0 ? '0' + cleanedHex : cleanedHex;

    // 计算字节长度并初始化 Uint8Array
    const byteLen = paddedHex.length / 2;
    const buffer = new Uint8Array(byteLen);

    // 每两个字符解析为一个字节
    for (let i = 0; i < byteLen; i++) {
        const byteHex = paddedHex.substring(i * 2, i * 2 + 2);
        buffer[i] = parseInt(byteHex, 16);
    }

    return buffer;
}
module.exports = {
    dev2cmd: async function (device) {
        let ret = []
        let sq = db_opt.get_sq();
        let driver = await device.getDriver({
            include: [{
                model: sq.models.modbus_read_meta,
            }, {
                model: sq.models.modbus_write_relay,
            }]
        })
        let fn;
        switch (driver.type_id) {
            case 1: // 读保持寄存器
                fn = 3;
                break;
            case 2: // 写单个线圈
                fn = 5;
                break;
            default:
                throw new Error('不支持的驱动类型');
        }
        for (let index = 0; index < driver.modbus_read_meta.length; index++) {
            const element = driver.modbus_read_meta[index];
            let req = make_req(fn, element.reg_address, 0, get_slave_id(device));
            ret.push({
                address: element.reg_address,
                req: req,
            });
        }
        for (let index = 0; index < driver.modbus_write_relays.length; index++) {
            const element = driver.modbus_write_relays[index];
            let req = make_req(fn, element.reg_address, hexStringToUint8Array(element.value), get_slave_id(device));
            ret.push({
                address: element.reg_address,
                req: req,
            });
        }
        return ret;
    },
    reply2dev: async function (device, reply, address) {
        let sq = db_opt.get_sq();
        let driver = await device.getDriver({
            include: [{
                model: sq.models.modbus_read_meta,
            }, {
                model: sq.models.modbus_write_relay,
            }]
        })
        let target;
        driver.modbus_read_meta.forEach((element) => {
            if (element.reg_address == address) {
                target = element;
            }
        });
        driver.modbus_write_relays.forEach((element) => {
            if (element.reg_address == address) {
                target = element;
            }
        });
        if (target && target.data_type) {
            let data = parse_reply(reply, target.data_type, get_slave_id(device));
            let device_data = await driver.getDeviceData({
                where: {
                    modbusReadMetaId: target.id,
                },
            });
            device_data.value = data;
            await device_data.save();
        }
    },
    error2dev: async function (device, err_msg) {
        device.error_info = err_msg;
        await device.save();
    }
};