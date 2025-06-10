const db_opt = require('./db_opt');
module.exports = {
    add_driver: async function (name, type_id, company) {
        let exist_record = await company.getDrivers({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            await company.createDriver({
                name: name,
                type_id: type_id,
            });
        }
    },
    del_driver: async function (driver_id) {
        let sq = db_opt.get_sq();
        let driver = await sq.models.driver.findByPk(driver_id);
        if (driver) {
            await driver.destroy();
        }
    },
    get_drivers: async function (company, pageNo) {
        let sq = db_opt.get_sq();
        let ret = await sq.models.driver.findAndCountAll({
            where: { companyId: company.id },
            offset: pageNo * 20,
            limit: 20,
            order: [['id', 'DESC']],
            include: [
                { model: sq.models.modbus_read_meta },
                { model: sq.models.modbus_write_relay }
            ],
            distinct: true,
        });
        return {
            drivers: ret.rows,
            total: ret.count,
        }
    },
    add_modbus_read_meta: async function (driver, title, reg_address, data_type) {
        let exist_record = await driver.getModbus_read_meta({
            where: { title: title },
        });
        if (exist_record.length == 0) {
            await driver.createModbus_read_metum({
                title: title,
                reg_address: reg_address,
                data_type: data_type,
            });
        }
    },
    del_modbus_read_meta: async function (meta_id) {
        let sq = db_opt.get_sq();
        let meta = await sq.models.modbus_read_meta.findByPk(meta_id);
        if (meta) {
            await meta.destroy();
        }
    },
    add_modbus_write_relay: async function (driver, action, reg_address, value) {
        let exist_record = await driver.getModbus_write_relays({
            where: { action: action, reg_address: reg_address },
        });
        if (exist_record.length == 0) {
            await driver.createModbus_write_relay({
                action: action,
                reg_address: reg_address,
                value: value,
            });
        }
    },
    del_modbus_write_relay: async function (relay_id) {
        let sq = db_opt.get_sq();
        let relay = await sq.models.modbus_write_relay.findByPk(relay_id);
        if (relay) {
            await relay.destroy();
        }
    },
    add_device: async function (driver, name, connection_key) {
        let exist_record = await driver.getDevices({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            let device = await driver.createDevice({
                name: name,
                connection_key: connection_key,
            });
            let metas = await driver.getModbus_read_meta();
            for (let index = 0; index < metas.length; index++) {
                const meta = metas[index];
                await device.createDevice_datum({
                    value: 0,
                    modbusReadMetumId: meta.id,
                });
            }
            let relays = await driver.getModbus_write_relays();
            if (relays.length > 0) {
                await device.setModbus_write_relay(relays[0]);
            }
        }
    },
    del_device: async function (device_id) {
        let sq = db_opt.get_sq();
        let device = await sq.models.device.findByPk(device_id);
        if (device) {
            await device.destroy();
        }
    },
    get_devices: async function (company, pageNo) {
        let sq = db_opt.get_sq();
        let ret = await sq.models.device.findAndCountAll({
            offset: pageNo * 20,
            limit: 20,
            order: [['driverId', 'DESC'], ['id', 'DESC']],
            include: [
                {
                    model: sq.models.driver,
                    where: { companyId: company.id },
                    required: true,
                    include: [
                        { model: sq.models.modbus_write_relay },
                    ]

                },
                {
                    model: sq.models.device_data, include: [
                        { model: sq.models.modbus_read_meta }
                    ]
                },
                {
                    model: sq.models.modbus_write_relay
                }
            ],
            distinct: true,
        });
        return {
            devices: ret.rows,
            total: ret.count,
        }
    },
};