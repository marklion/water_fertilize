const db_opt = require('../lib/db_opt');
const api_param_result_define = require('../lib/api_param_result_define');
const rbac_lib = require('../lib/rbac_lib');
const policy_lib = require('../lib/policy_lib');

module.exports = {
    name: 'policy',
    description: '策略',
    methods: {
        add_policy_template: {
            name: '创建策略模板',
            description: '创建策略模板',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, have_to: true, mean: '策略模板名称', example: '温度控制策略' },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                await policy_lib.add_policy_template(company, body.name);
                return { result: true };
            }
        },
        del_policy_template: {
            name: '删除策略模板',
            description: '删除策略模板',
            is_write: true,
            is_get_api: false,
            params: {
                pt_id: { type: Number, have_to: true, mean: '策略模板ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let pt = await db_opt.get_sq().models.policy_template.findByPk(body.pt_id);
                if (pt && company && await company.hasPolicy_template(pt)) {
                    await policy_lib.del_policy_template(body.pt_id);
                }
                else {
                    throw { err_msg: '没有权限删除策略模板' };
                }
                return { result: true };
            }
        },
        get_policy_templates: {
            name: '获取策略模板列表',
            description: '获取策略模板列表',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                policy_templates: {
                    type: Array,
                    mean: '策略模板列表',
                    explain: api_param_result_define.policy_template_info,
                },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                return await policy_lib.get_policy_templates(company, body.pageNo);
            }
        },
        add_data_source: {
            name: '添加数据源到策略模板',
            description: '添加数据源到策略模板',
            is_write: true,
            is_get_api: false,
            params: {
                pt_id: { type: Number, have_to: true, mean: '策略模板ID', example: 1 },
                modbus_read_meta_id: { type: Number, have_to: true, mean: 'Modbus读取元数据ID', example: 1 },
                name: { type: String, have_to: true, mean: '数据源名称', example: '温度传感器' },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let pt = await db_opt.get_sq().models.policy_template.findByPk(body.pt_id);
                let mrm = await db_opt.get_sq().models.modbus_read_meta.findByPk(body.modbus_read_meta_id);
                if (pt && company && mrm && await company.hasPolicy_template(pt)) {
                    await policy_lib.add_data_source(pt, mrm, body.name);
                }
                else {
                    throw { err_msg: '没有权限添加数据源到策略模板' };
                }
                return { result: true };
            },
        },
        del_data_source: {
            name: '从策略模板删除数据源',
            description: '从策略模板删除数据源',
            is_write: true,
            is_get_api: false,
            params: {
                ds_id: { type: Number, have_to: true, mean: '数据源ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let ds = await db_opt.get_sq().models.policy_data_source.findByPk(body.ds_id, {
                    include: [{ model: db_opt.get_sq().models.policy_template }]
                });
                if (ds && company && await company.hasPolicy_template(ds.policy_template)) {
                    await policy_lib.del_data_source(body.ds_id);
                }
                else {
                    throw { err_msg: '没有权限删除数据源' };
                }
                return { result: true };
            },
        },
        add_action_node: {
            name: '添加动作节点到策略模板',
            description: '添加动作节点到策略模板',
            is_write: true,
            is_get_api: false,
            params: {
                pt_id: { type: Number, have_to: true, mean: '策略模板ID', example: 1 },
                modbus_write_relay_id: { type: Number, have_to: true, mean: 'Modbus写入继电器ID', example: 1 },
                name: { type: String, have_to: true, mean: '动作节点名称', example: '开灯' },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let pt = await db_opt.get_sq().models.policy_template.findByPk(body.pt_id);
                let mwr = await db_opt.get_sq().models.modbus_write_relay.findByPk(body.modbus_write_relay_id);
                if (pt && company && mwr && await company.hasPolicy_template(pt)) {
                    await policy_lib.add_action_node(pt, mwr, body.name);
                }
                else {
                    throw { err_msg: '没有权限添加动作节点到策略模板' };
                }
                return { result: true };
            },
        },
        del_action_node: {
            name: '从策略模板删除动作节点',
            description: '从策略模板删除动作节点',
            is_write: true,
            is_get_api: false,
            params: {
                an_id: { type: Number, have_to: true, mean: '动作节点ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let an = await db_opt.get_sq().models.policy_action_node.findByPk(body.an_id, {
                    include: [{ model: db_opt.get_sq().models.policy_template }]
                });
                if (an && company && await company.hasPolicy_template(an.policy_template)) {
                    await policy_lib.del_action_node(body.an_id);
                }
                else {
                    throw { err_msg: '没有权限删除动作节点' };
                }
                return { result: true };
            },
        },
        add_state_node: {
            name: '添加状态节点到策略模板',
            description: '添加状态节点到策略模板',
            is_write: true,
            is_get_api: false,
            params: {
                pt_id: { type: Number, have_to: true, mean: '策略模板ID', example: 1 },
                name: { type: String, have_to: true, mean: '状态节点名称', example: '温度正常' },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let pt = await db_opt.get_sq().models.policy_template.findByPk(body.pt_id);
                if (pt && company && await company.hasPolicy_template(pt)) {
                    await policy_lib.add_state_node(pt, body.name);
                }
                else {
                    throw { err_msg: '没有权限添加状态节点到策略模板' };
                }
                return { result: true };
            },
        },
        del_state_node: {
            name: '从策略模板删除状态节点',
            description: '从策略模板删除状态节点',
            is_write: true,
            is_get_api: false,
            params: {
                sn_id: { type: Number, have_to: true, mean: '状态节点ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let sn = await db_opt.get_sq().models.policy_state_node.findByPk(body.sn_id, {
                    include: [{ model: db_opt.get_sq().models.policy_template }]
                });
                if (sn && company && await company.hasPolicy_template(sn.policy_template)) {
                    await policy_lib.del_state_node(body.sn_id);
                }
                else {
                    throw { err_msg: '没有权限删除状态节点' };
                }
                return { result: true };
            },
        },
        add_state_action: {
            name: '添加状态动作到状态节点',
            description: '添加状态动作到状态节点',
            is_write: true,
            is_get_api: false,
            params: {
                sn_id: { type: Number, have_to: true, mean: '状态节点ID', example: 1 },
                an_id: { type: Number, have_to: true, mean: '动作节点ID', example: 1 },
                priority: { type: Number, have_to: true, mean: '优先级', example: 1 },
                action_type: { type: String, have_to: true, mean: '动作类型', example: 'enter' }, // enter, do, exit
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let sn = await db_opt.get_sq().models.policy_state_node.findByPk(body.sn_id, {
                    include: [{ model: db_opt.get_sq().models.policy_template }]
                });
                let an = await db_opt.get_sq().models.policy_action_node.findByPk(body.an_id);
                if (sn && company && an && await company.hasPolicy_template(sn.policy_template)) {
                    if (body.action_type === 'enter') {
                        await policy_lib.add_enter_action(sn, an, body.priority);
                    } else if (body.action_type === 'do') {
                        await policy_lib.add_do_action(sn, an, body.priority);
                    } else if (body.action_type === 'exit') {
                        await policy_lib.add_exit_action(sn, an, body.priority);
                    } else {
                        throw { err_msg: '未知的动作类型' };
                    }
                }
                else {
                    throw { err_msg: '没有权限添加状态动作到状态节点' };
                }
                return { result: true };
            }
        },
        del_state_action: {
            name: '从状态节点删除状态动作',
            description: '从状态节点删除状态动作',
            is_write: true,
            is_get_api: false,
            params: {
                action_id: { type: Number, have_to: true, mean: '状态动作ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let sa = await db_opt.get_sq().models.policy_state_action.findByPk(body.sa_id, {
                    include: [{ model: db_opt.get_sq().models.policy_state_node, include: [{ model: db_opt.get_sq().models.policy_template }] }]
                });
                if (sa && company && await company.hasPolicy_template(sa.policy_state_node.policy_template)) {
                    await policy_lib.del_action(body.action_id);
                }
                else {
                    throw { err_msg: '没有权限删除状态动作' };
                }
                return { result: true };
            },
        },
        add_transition: {
            name: '添加状态转换到状态节点',
            description: '添加状态转换到状态节点',
            is_write: true,
            is_get_api: false,
            params: {
                from_node_id: { type: Number, have_to: true, mean: '来源状态节点ID', example: 1 },
                to_node_id: { type: Number, have_to: true, mean: '目标状态节点ID', example: 2 },
                compare_condition: { type: String, have_to: true, mean: '转换条件', example: '温度 > 30' },
                priority: { type: Number, have_to: true, mean: '优先级', example: 1 },
                ds_id: { type: Number, have_to: true, mean: '数据源ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let from_node = await db_opt.get_sq().models.policy_state_node.findByPk(body.from_node_id, {
                    include: [{ model: db_opt.get_sq().models.policy_template }]
                });
                let to_node = await db_opt.get_sq().models.policy_state_node.findByPk(body.to_node_id);
                let ds = await db_opt.get_sq().models.policy_data_source.findByPk(body.ds_id);
                if (from_node && to_node && ds && company && await company.hasPolicy_template(from_node.policy_template)) {
                    await policy_lib.add_transition(from_node, to_node, ds, body.compare_condition, body.priority);
                }
                else {
                    throw { err_msg: '没有权限添加状态转换' };
                }
                return { result: true };
            },
        },
        del_transition: {
            name: '从状态节点删除状态转换',
            description: '从状态节点删除状态转换',
            is_write: true,
            is_get_api: false,
            params: {
                transition_id: { type: Number, have_to: true, mean: '状态转换ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let transition = await db_opt.get_sq().models.policy_state_transition.findByPk(body.transition_id, {
                    include: [{ model: db_opt.get_sq().models.policy_state_node, as: 'from_state', include: [{ model: db_opt.get_sq().models.policy_template }] }]
                });
                if (transition && company && await company.hasPolicy_template(transition.from_state.policy_template)) {
                    await policy_lib.del_transition(body.transition_id);
                }
                else {
                    throw { err_msg: '没有权限删除状态转换' };
                }
                return { result: true };
            },
        },
        get_all_modbus_read_meta: {
            name: '获取所有Modbus读取元数据',
            description: '获取所有Modbus读取元数据',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                modbus_read_meta: {
                    type: Array,
                    mean: 'Modbus读取元数据列表',
                    explain: {
                        id: { type: Number, mean: '元数据ID', example: 1 },
                        whole_name: { type: String, mean: '元数据名称', example: '温度传感器' },
                    },
                }
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let sq = db_opt.get_sq();
                let ret = await sq.models.modbus_read_meta.findAndCountAll({
                    distinct: true,
                    offset: body.pageNo * 20,
                    limit: 20,
                    order: [['driverId', 'DESC'], ['id', 'DESC']],
                    include: [
                        {
                            model: sq.models.driver,
                            where: { companyId: company.id },
                            required: true,
                        }
                    ],
                });
                return {
                    modbus_read_meta: ret.rows.map(item => ({
                        id: item.id,
                        whole_name: item.title + '-' + item.driver.name,
                    })),
                    total: ret.count,
                };
            },
        },
        get_all_modbus_write_relays: {
            name: '获取所有Modbus写入继电器',
            description: '获取所有Modbus写入继电器',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                modbus_write_relays: {
                    type: Array,
                    mean: 'Modbus写入继电器列表',
                    explain: {
                        id: { type: Number, mean: '继电器ID', example: 1 },
                        whole_name: { type: String, mean: '继电器名称', example: '开灯-驱动A' },
                    },
                }
            },
            func: async function (body, token) {
                let company = await rbac_lib.get_company_by_token(token);
                let sq = db_opt.get_sq();
                let ret = await sq.models.modbus_write_relay.findAndCountAll({
                    distinct: true,
                    offset: body.pageNo * 20,
                    limit: 20,
                    order: [['driverId', 'DESC'], ['id', 'DESC']],
                    include: [
                        {
                            model: sq.models.driver,
                            where: { companyId: company.id },
                            required: true,
                        }
                    ],
                });
                return {
                    modbus_write_relays: ret.rows.map(item => ({
                        id: item.id,
                        whole_name: item.action + '-' + item.driver.name,
                    })),
                    total: ret.count,
                };
            },
        },
    },
}
