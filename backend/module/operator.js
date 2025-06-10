const db_opt = require('../lib/db_opt');
const api_param_result_define = require('../lib/api_param_result_define');
const rbac_lib = require('../lib/rbac_lib');
const driver_lib = require('../lib/driver_lib');

module.exports = {
    name: 'operator',
    description: '操作',
    methods: {
        get_devices: {
            name: '获取所有设备',
            description: '获取所有设备',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                devices: {
                    type: Array,
                    mean: '设备列表',
                    explain: api_param_result_define.device_info,
                },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                return await driver_lib.get_devices(company, body.pageNo);
            },
        },
        set_device_action: {
            name: '添加设备动作',
            description: '添加设备动作',
            is_write: true,
            is_get_api: false,
            params: {
                device_id: { type: Number, have_to: true, mean: '设备ID', example: 1 },
                relay_id: { type: Number, have_to: true, mean: '继电器ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let company = await rbac_lib.get_company_by_token(token);
                let device = await sq.models.device.findByPk(body.device_id, {
                    include: [{
                        model: sq.models.driver,
                    }],
                });
                let relay = await sq.models.modbus_write_relay.findByPk(body.relay_id);
                if (company && device && device.driver && relay && await company.hasDriver(device.driver) && await device.driver.hasModbus_write_relay(relay)) {
                    await device.setModbus_write_relay(relay);
                }
                else {
                    throw {
                        err_msg: '没有权限设定动作',
                    }
                }
                return { result: true };
            },
        },
    }
}
