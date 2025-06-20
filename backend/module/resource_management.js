const db_opt = require('../lib/db_opt');
const api_param_result_define = require('../lib/api_param_result_define');
const rbac_lib = require('../lib/rbac_lib');
const driver_lib = require('../lib/driver_lib');

module.exports = {
    name: 'resource_management',
    description: '资源管理',
    methods: {
        create_driver:{
            name:'创建驱动',
            description: '创建驱动',
            is_write: true,
            is_get_api: false,
            params:{
                name:{type: String, have_to:true, mean:'驱动名称', example:'abc'},
                type_id:{type: Number, have_to:true, mean:'驱动类型ID', example:1},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func:async function(body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                await driver_lib.add_driver(body.name, body.type_id, company);
                return { result: true };
            },
        },
        delete_driver:{
            name:'删除驱动',
            description: '删除驱动',
            is_write: true,
            is_get_api: false,
            params:{
                driver_id:{type: Number, have_to:true, mean:'驱动ID', example:1},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let driver = await db_opt.get_sq().models.driver.findByPk(body.driver_id);
                if (company && driver && await company.hasDriver(driver)) {
                    await driver_lib.del_driver(driver.id);
                }
                else
                {
                    throw {
                        err_msg: '没有权限删除该驱动',
                    }
                }
                return { result: true };
            },
        },
        get_drivers:{
            name:'获取驱动列表',
            description: '获取驱动列表',
            is_write: false,
            is_get_api: true,
            params:{
            },
            result:{
                drivers: {type: Array, mean: '驱动列表', explain: api_param_result_define.driver_info},
            },
            func:async function(body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let ret = await driver_lib.get_drivers(company, body.pageNo);
                return ret;
            }
        },
        add_driver_meta:{
            name:'添加驱动元数据',
            description: '添加驱动元数据',
            is_write: true,
            is_get_api: false,
            params:{
                driver_id:{type: Number, have_to:true, mean:'驱动ID', example:1},
                title:{type: String, have_to:true, mean:'元数据标题', example:'温度'},
                reg_address:{type: Number, have_to:true, mean:'寄存器地址', example:100},
                data_type:{type: String, have_to:true, mean:'数据类型', example:'int16'},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func:async function(body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let driver = await db_opt.get_sq().models.driver.findByPk(body.driver_id);
                if (company && driver && await company.hasDriver(driver)) {
                    await driver_lib.add_modbus_read_meta(driver, body.title, body.reg_address, body.data_type);
                }
                else
                {
                    throw {
                        err_msg: '没有权限添加驱动元数据',
                    }
                }
                return { result: true };
            },
        },
        del_driver_meta:{
            name:'删除驱动元数据',
            description: '删除驱动元数据',
            is_write: true,
            is_get_api: false,
            params:{
                meta_id:{type: Number, have_to:true, mean:'元数据ID', example:1},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func:async function(body, token) {
                let sq = db_opt.get_sq();
                let meta = await sq.models.modbus_read_meta.findByPk(body.meta_id);
                if (meta) {
                    let driver = await meta.getDriver();
                    let company = await rbac_lib.get_company_by_token(token);
                    if (company && driver && await company.hasDriver(driver)) {
                        await driver_lib.del_modbus_read_meta(meta.id);
                    }
                    else
                    {
                        throw {
                            err_msg: '没有权限删除驱动元数据',
                        }
                    }
                }
                return { result: true };
            },
        },
        add_driver_relay:{
            name:'添加驱动继电器',
            description: '添加驱动继电器',
            is_write: true,
            is_get_api: false,
            params:{
                driver_id:{type: Number, have_to:true, mean:'驱动ID', example:1},
                action:{type: String, have_to:true, mean:'动作', example:'开'},
                reg_address:{type: Number, have_to:true, mean:'寄存器地址', example:200},
                value:{type: String, have_to:true, mean:'值', example:'1'},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func:async function(body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let driver = await db_opt.get_sq().models.driver.findByPk(body.driver_id);
                if (company && driver && await company.hasDriver(driver)) {
                    await driver_lib.add_modbus_write_relay(driver, body.action, body.reg_address, body.value);
                }
                else
                {
                    throw {
                        err_msg: '没有权限添加驱动继电器',
                    }
                }
                return { result: true };
            }
        },
        del_driver_relay:{
            name:'删除驱动继电器',
            description: '删除驱动继电器',
            is_write: true,
            is_get_api: false,
            params:{
                relay_id:{type: Number, have_to:true, mean:'继电器ID', example:1},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func:async function(body, token) {
                let sq = db_opt.get_sq();
                let relay = await sq.models.modbus_write_relay.findByPk(body.relay_id);
                if (relay) {
                    let driver = await relay.getDriver();
                    let company = await rbac_lib.get_company_by_token(token);
                    if (company && driver && await company.hasDriver(driver)) {
                        await driver_lib.del_modbus_write_relay(relay.id);
                    }
                    else
                    {
                        throw {
                            err_msg: '没有权限删除驱动继电器',
                        }
                    }
                }
                return { result: true };
            }
        },
        add_device:{
            name:'添加设备',
            description: '添加设备',
            is_write: true,
            is_get_api: false,
            params:{
                driver_id:{type: Number, have_to:true, mean:'驱动ID', example:1},
                name:{type: String, have_to:true, mean:'设备名称', example:'设备A'},
                connection_key:{type: String, have_to:true, mean:'连接密钥', example:'123456'},
            },
            result:{
                result: {type: Boolean, mean: '操作结果', example: true},
            },
            func:async function(body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let admin_company = await rbac_lib.get_admin_company();
                let driver = await db_opt.get_sq().models.driver.findByPk(body.driver_id);
                if (driver && (await company.hasDriver(driver) || await admin_company.hasDriver(driver))) {
                    await driver_lib.add_device(driver, body.name, body.connection_key, company);
                }
                else
                {
                    throw {
                        err_msg: '没有权限添加设备',
                    }
                }
                return { result: true };
            }
        },
        del_device:{
            name:'删除设备',
            description: '删除设备',
            is_write: true,
            is_get_api: false,
            params:{
                device_id:{type: Number, have_to:true, mean:'设备ID', example:1},
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let device = await sq.models.device.findByPk(body.device_id);
                let company = await rbac_lib.get_company_by_token(token);
                if (device && company && await company.hasDevice(device)) {
                    await driver_lib.del_device(device.id);
                }
                else {

                    throw {
                        err_msg: '没有权限删除设备',
                    }
                }
                return { result: true };
            }
        },
        get_devices: {
            name: '获取设备列表',
            description: '获取设备列表',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                devices: { type: Array, mean: '设备列表', explain: api_param_result_define.device_info },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let ret = await driver_lib.get_devices(company, body.pageNo);
                return ret;
            }
        },
    }
}