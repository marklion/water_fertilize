const ModbusPDU = require('modbus-pdu')
const crc = require('crc');
const db_opt = require('../../lib/db_opt')
function make_req(fn, address, value, slaver_id) {
    let pdu_data = null;
    if (fn == 3) {
        pdu_data = ModbusPDU.ReadHoldingRegisters.Request.build(address, 2);
    } else if (fn == 5) {
        let coil_value = value == 'f' ? 0xFF00 : 0x0000; // 线圈值为1时，寄存器值为0xFF00，否则为0x0000
        pdu_data = ModbusPDU.WriteSingleCoil.Request.build(address, coil_value);
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
            ret = reply_buffer.readUInt32BE(3);
            console.log(ret.toString(16));

        }
    }

    return ret;
}

function get_slave_id(device) {
    let ck = JSON.parse(device.connection_key);
    return ck.slaver_id || 0x01; // 默认从站ID为1
}
module.exports = {
    dev2cmd: async function (device) {
        let ret = []
        let sq = db_opt.get_sq();
        let driver = await device.getDriver({
            include: [{
                model: sq.models.modbus_read_meta,
            }]
        })
        let write_relay = await device.getModbus_write_relay();
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
        if (write_relay)
        {
            let req = make_req(fn, write_relay.reg_address, write_relay.value, get_slave_id(device));
            ret.push({
                address: write_relay.reg_address,
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
        if (target) {
            device.error_info = '';
            await device.save();
            if (target.data_type) {
                let data = parse_reply(reply, target.data_type, get_slave_id(device));
                let device_data = await device.getDevice_data({
                    where: {
                        modbusReadMetumId: target.id,
                    },
                });
                device_data[0].value = data;
                await device_data[0].save();
            }
        }

    },
    error2dev: async function (device, err_msg) {
        device.error_info = err_msg;
        await device.save();
    }
};