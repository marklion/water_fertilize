const db_opt = require('../lib/db_opt');
const api_param_result_define = require('../lib/api_param_result_define');
const rbac_lib = require('../lib/rbac_lib');
const driver_lib = require('../lib/driver_lib');
const policy_lib = require('../lib/policy_lib');

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
                let admin_company = await rbac_lib.get_admin_company();
                let device = await sq.models.device.findByPk(body.device_id, {
                    include: [{
                        model: sq.models.driver,
                    }],
                });
                let relay = await sq.models.modbus_write_relay.findByPk(body.relay_id);
                if (device && device.driver && relay && ((
                    company && await company.hasDriver(device.driver)) || (
                        admin_company && await admin_company.hasDriver(device.driver)
                    )) &&
                    await device.driver.hasModbus_write_relay(relay)
                ) {
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
        get_runtime_policy_instances: {
            name: '获取所有策略实例',
            description: '获取所有策略实例',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                policy_instances: {
                    type: Array,
                    mean: '策略实例列表',
                    explain: api_param_result_define.policy_instance_runtime_info,
                },
                total: { type: Number, mean: '总数', example: 100 },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let company = await rbac_lib.get_company_by_token(token);
                let pis_resp = await sq.models.policy_instance.findAndCountAll({
                    distinct: true,
                    limit: 20,
                    offset: body.pageNo * 20,
                    order: [['policyTemplateId', 'ASC'], ['id', 'DESC']],
                    include: [{
                        model: sq.models.policy_template,
                        require: true,
                    }],
                    where: {
                        status: '就绪',
                        companyId: company.id,
                    },
                });
                let policy_instances = [];
                for (let pi of pis_resp.rows) {
                    policy_instances.push(await policy_lib.make_pi_runtime(pi));
                }
                return {
                    policy_instances: policy_instances,
                    total: pis_resp.count,
                };
            },
        },
        set_policy_variable: {
            name: '设置策略变量',
            description: '设置策略变量',
            is_write: true,
            is_get_api: false,
            params: {
                piv_id:{ type: Number, have_to: true, mean: '策略变量ID', example: 1 },
                value: { type: String, have_to: true, mean: '变量值', example: 'new_value' },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let ret = { result: true };
                let sq = db_opt.get_sq();
                let company = await rbac_lib.get_company_by_token(token);
                let piv = await sq.models.policy_instance_variable.findByPk(body.piv_id, {
                    include: [{
                        model: sq.models.policy_instance,
                        require: true,
                    }],
                });
                if (piv && piv.policy_instance && piv.policy_instance.companyId == company.id) {
                    piv.value = body.value;
                    await piv.save();
                }
                else {
                    throw {
                        err_msg: '没有权限设置变量',
                    }
                }
                return ret;
            },
        },
    }
}
