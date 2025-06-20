const moment = require('moment');
const db_opt = require('./db_opt');
const rbac_lib = require('./rbac_lib');
module.exports = {
    add_policy_template: async function (company, name) {
        let exist_record = await company.getPolicy_templates({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            await company.createPolicy_template({
                name: name,
            });
        }
    },
    del_policy_template: async function (pt_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_template.findByPk(pt_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    get_policy_templates: async function (company, pageNo) {
        let sq = db_opt.get_sq();
        let pageSize = 20;
        let offset = pageNo * pageSize;

        let admin_company = await rbac_lib.get_admin_company();
        let ret = await sq.models.policy_template.findAndCountAll({
            where: {
                [db_opt.Op.or]: [
                    { companyId: company.id },
                    { companyId: admin_company.id }
                ],
            },
            limit: pageSize,
            offset: offset,
            order: [['id', 'DESC']],
            distinct: true,
            include: [
                {
                    model: sq.models.company,
                },
                {
                    model:sq.models.policy_variable,
                },
                {
                    model: sq.models.policy_data_source, include: [
                        {
                            model: sq.models.modbus_read_meta, include: [
                                { model: sq.models.driver }
                            ]
                        },
                    ]
                },
                {
                    model: sq.models.policy_action_node, include: [
                        {
                            model: sq.models.modbus_write_relay, include: [
                                { model: sq.models.driver }
                            ]
                        },
                    ]
                },
                {
                    model: sq.models.policy_state_node, include: [
                        {
                            model: sq.models.policy_state_action,
                            as: 'enter_actions',
                            include: [{ model: sq.models.policy_action_node }],
                            separate: true,
                            order: [['priority', 'ASC']]
                        },
                        {
                            model: sq.models.policy_state_action,
                            as: 'do_actions',
                            include: [{ model: sq.models.policy_action_node }],
                            separate: true,
                            order: [['priority', 'ASC']]
                        },
                        {
                            model: sq.models.policy_state_action,
                            as: 'exit_actions',
                            include: [{ model: sq.models.policy_action_node }],
                            separate: true,
                            order: [['priority', 'ASC']]
                        },
                        {
                            model: sq.models.policy_state_transition,
                            as: 'from_transitions',
                            include: [
                                { model: sq.models.policy_state_node, as: 'to_state' },
                            ],
                            separate: true,
                            order: [['priority', 'ASC']]
                        },
                    ]
                },
            ],
        });
        ret.rows.forEach(item=>{
            item.made_by_admin = item.company.is_admin;
        });
        return {
            count: ret.count,
            policy_templates: ret.rows,
        };
    },
    add_data_source: async function (policy_template, modbus_read_meta, name) {
        let exist_record = await policy_template.getPolicy_data_sources({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            let new_record = await policy_template.createPolicy_data_source({
                name: name,
            });
            await new_record.setModbus_read_metum(modbus_read_meta);
        }
    },
    del_data_source: async function (ds_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_data_source.findByPk(ds_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    add_action_node: async function (policy_template, modbus_write_relay, name) {
        let exist_record = await policy_template.getPolicy_action_nodes({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            let new_record = await policy_template.createPolicy_action_node({
                name: name,
            });
            await new_record.setModbus_write_relay(modbus_write_relay);
        }
    },
    del_action_node: async function (an_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_action_node.findByPk(an_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    add_state_node: async function (policy_template, name) {
        let exist_record = await policy_template.getPolicy_state_nodes({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            await policy_template.createPolicy_state_node({
                name: name,
            });
        }
    },
    del_state_node: async function (sn_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_state_node.findByPk(sn_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    add_enter_action: async function (state_node, action_node, priority) {
        let exist_record = await state_node.getEnter_actions(
            {
                where: { priority: priority }
            }
        );
        if (exist_record.length == 0) {
            let new_record = await state_node.createEnter_action({
                priority: priority
            });
            await new_record.setPolicy_action_node(action_node);
        }
    },
    add_do_action: async function (state_node, action_node, priority) {
        let exist_record = await state_node.getDo_actions(
            {
                where: { priority: priority }
            }
        );
        if (exist_record.length == 0) {
            let new_record = await state_node.createDo_action({
                priority: priority
            });
            await new_record.setPolicy_action_node(action_node);
        }
    },
    add_exit_action: async function (state_node, action_node, priority) {
        let exist_record = await state_node.getExit_actions(
            {
                where: { priority: priority }
            }
        );
        if (exist_record.length == 0) {
            let new_record = await state_node.createExit_action({
                priority: priority
            });
            await new_record.setPolicy_action_node(action_node);
        }
    },
    del_action: async function (action_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_state_action.findByPk(action_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    add_transition: async function (from_node, to_node, compare_condition, priority) {
        let exist_record = await from_node.getFrom_transitions({
            where: {
                compare_condition: compare_condition,
            }
        });
        if (exist_record.length == 0) {
            let new_record = await from_node.createFrom_transition({
                compare_condition: compare_condition,
                priority: priority
            });
            await new_record.setTo_state(to_node);
        }
    },
    del_transition: async function (transition_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_state_transition.findByPk(transition_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    add_policy_instance: async function (policy_template, name, company) {
        let state_nodes = await policy_template.getPolicy_state_nodes();
        if (state_nodes.length > 0) {
            let exist_record = await policy_template.getPolicy_instances({
                where: {
                    name: name,
                    companyId: company.id
                },
            });
            if (exist_record.length == 0) {
                let new_record = await policy_template.createPolicy_instance({
                    name: name,
                });
                await new_record.setPolicy_state_node(state_nodes[0]);
                await new_record.setCompany(company);
                let pvs = await policy_template.getPolicy_variables();
                for (let pv of pvs) {
                    let new_piv = await new_record.createPolicy_instance_variable({
                    });
                    await new_piv.setPolicy_variable(pv);
                }
            }
        }
        else {
            throw {
                err_msg: '策略模板必须至少有一个状态节点',
            }
        }
    },
    del_policy_instance: async function (pi_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_instance.findByPk(pi_id);
        if (exist_record) {
            let pivs = await exist_record.getPolicy_instance_variables();
            for (let piv of pivs) {
                await piv.destroy();
            }
            await exist_record.destroy();
        }
    },
    get_policy_instances: async function (company, pageNo) {
        let sq = db_opt.get_sq();
        let pageSize = 20;
        let offset = pageNo * pageSize;

        let ret = await sq.models.policy_instance.findAndCountAll({
            where: {
                companyId: company.id,
            },
            distinct: true,
            limit: pageSize,
            offset: offset,
            order: [['policyTemplateId', 'ASC'], ['id', 'DESC']],
            include: [
                {
                    model: sq.models.policy_template, include: [
                        {
                            model: sq.models.policy_data_source
                        },
                        {
                            model: sq.models.policy_action_node
                        },
                    ],
                    required: true,
                },
                {
                    model: sq.models.policy_state_node,
                },
                {
                    model: sq.models.policy_instance_data,
                    include: [
                        { model: sq.models.policy_data_source },
                        { model: sq.models.device }
                    ],
                },
                {
                    model: sq.models.policy_instance_action,
                    include: [
                        { model: sq.models.policy_action_node },
                        { model: sq.models.device }
                    ],
                },
                {
                    model:sq.models.policy_instance_variable,
                    include:[
                        { model: sq.models.policy_variable }
                    ],
                }
            ],
        });
        return {
            count: ret.count,
            policy_instances: ret.rows,
        };
    },
    bind_device_data_source: async function (device, policy_data_source, policy_instance) {
        let exist_record = await policy_instance.getPolicy_instance_data({
            where: { policyDataSourceId: policy_data_source.id },
        });
        if (exist_record.length == 0) {
            await policy_instance.createPolicy_instance_datum({
                deviceId: device.id,
                policyDataSourceId: policy_data_source.id,
            });
        }
    },
    unbind_device_data_source: async function (pid_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_instance_data.findByPk(pid_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    bind_device_action_node: async function (device, policy_action_node, policy_instance) {
        let exist_record = await policy_instance.getPolicy_instance_actions({
            where: { policyActionNodeId: policy_action_node.id },
        });
        if (exist_record.length == 0) {
            await policy_instance.createPolicy_instance_action({
                deviceId: device.id,
                policyActionNodeId: policy_action_node.id,
            });
        }
    },
    unbind_device_action_node: async function (pia_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_instance_action.findByPk(pia_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    update_policy_instance_status: async function (policy_instance) {
        let status = '待完善'
        let policy_template = await policy_instance.getPolicy_template({
            include: [
                { model: db_opt.get_sq().models.policy_data_source },
                { model: db_opt.get_sq().models.policy_action_node },
            ]
        });
        let data_finish = true;
        for (let index = 0; index < policy_template.policy_data_sources.length; index++) {
            const element = policy_template.policy_data_sources[index];
            let exist_record = await policy_instance.getPolicy_instance_data({
                where: { policyDataSourceId: element.id },
            });
            if (exist_record.length == 0) {
                data_finish = false;
                break;
            }
        }
        let action_finish = true;
        for (let index = 0; index < policy_template.policy_action_nodes.length; index++) {
            const element = policy_template.policy_action_nodes[index];
            let exist_record = await policy_instance.getPolicy_instance_actions({
                where: { policyActionNodeId: element.id },
            });
            if (exist_record.length == 0) {
                action_finish = false;
                break;
            }
        }
        if (data_finish && action_finish) {
            status = '就绪';
            await this.record_state_init_values(policy_instance);
            policy_instance.state_refresh_time = moment().format('YYYY-MM-DD HH:mm:ss');
        }
        policy_instance.status = status;
        await policy_instance.save();
    },
    make_pi_runtime: async function (pi) {
        let sq = db_opt.get_sq();
        let pt = await pi.getPolicy_template();
        let psn = await pi.getPolicy_state_node();
        let pids = await pi.getPolicy_instance_data({
            include: [{
                model: sq.models.policy_data_source,
                include: [{
                    model: sq.models.modbus_read_meta,
                }],
            }, {
                model: sq.models.device,
            }]
        });
        let pias = await pi.getPolicy_instance_actions({
            include: [{
                model: sq.models.policy_action_node,
                include: [{
                    model: sq.models.modbus_write_relay,
                }],
            }, {
                model: sq.models.device,
                include: [{
                    model: sq.models.modbus_write_relay,
                }],
            }]
        });
        let pivs = await pi.getPolicy_instance_variables({
            include: [{
                model: sq.models.policy_variable,
            }],
        });
        let data = [];
        let actions = [];
        for (let pid of pids) {
            let data_items = await pid.device.getDevice_data({
                where: {
                    modbusReadMetumId: pid.policy_data_source.modbus_read_metum.id,
                }
            });
            data.push({
                id: pid.id,
                data_source_name: pid.policy_data_source.name,
                value: data_items[0].value,
                init_value: pid.value,
            });
        }
        for (let pia of pias) {
            actions.push({
                id: pia.id,
                action_node_name: pia.policy_action_node.name,
                do: pia.device.modbus_write_relay.id == pia.policy_action_node.modbus_write_relay.id,
            });
        }
        let variables = [];
        for (let piv of pivs) {
            variables.push({
                id: piv.id,
                name: piv.policy_variable.name,
                value: piv.value,
            });
        }
        return {
            id: pi.id,
            name: pi.name,
            template_name: pt.name,
            state_name: psn.name,
            data: data,
            actions: actions,
            variables: variables,
        }
    },
    get_value_by_pi_and_pds: async function (pi_id, pds_id) {
        let ret = 0;
        let sq = db_opt.get_sq();
        let pi = await sq.models.policy_instance.findByPk(pi_id);
        let pds = await sq.models.policy_data_source.findByPk(pds_id, {
            include: [
                { model: sq.models.modbus_read_meta }
            ]
        });
        let pids = await pds.getPolicy_instance_data({
            where: { policyInstanceId: pi.id },
            include: [{ model: sq.models.device }],
        });
        if (pids.length == 1) {
            let device = pids[0].device;
            let mrm = pds.modbus_read_metum;
            let device_data = await device.getDevice_data({
                where: { modbusReadMetumId: mrm.id },
            });
            ret = device_data[0] ? device_data[0].value : 0;
        }
        return ret;
    },
    get_continue_sec: async function (pi_id, coe) {
        let ret = 0;
        let sq = db_opt.get_sq();
        let pi = await sq.models.policy_instance.findByPk(pi_id);
        let last_time = moment(pi.state_refresh_time);
        let now = moment();
        ret = now.diff(last_time, 'seconds');
        return ret * coe;
    },
    /**
     * 判断策略实例是否满足条件
     * @param {Object} policyInstance 策略实例对象
     * @param {string} conditionJson 条件JSON字符串
     *      {
     *          "and": [
     *              {
     *                  "left": { "pds_id": 1 },
     *                  "right": { "constant_value": 10 },
     *                  "operator": ">"
     *              },
     *              {
     *                "left": { "pv_id": 1 },
     *                "right": { "offset_pds_id": 2 },
     *                 "operator": "<"
     *              },
     *              {
     *                  "or": [{
     *                      "left": { "pds_id": 2 },
     *                      "right": { "offset_pds_id": 3 },
     *                      "operator": "<="},{
     *                      "left": { "duration": 5 },
     *                      "right": { "constant_value": 30 },
     *                      "operator": "=="
     *                  }]
     *              }
     *          ],
     *      }
     * @returns {Promise<boolean>} 是否满足条件
     */
    shouldTransition: async function (policyInstance, conditionJson) {
        async function evaluateCondition(condition) {
            // 处理逻辑组合条件
            if (condition.and) {
                const results = await Promise.all(condition.and.map(subCond => evaluateCondition(subCond)));
                return results.every(result => result);
            }
            if (condition.or) {
                const results = await Promise.all(condition.or.map(subCond => evaluateCondition(subCond)));
                return results.some(result => result);
            }
            return await handleValueCompare(condition);
        }

        async function get_value_from_condition(condition, position) {
            let ret = 0;
            let value_obj = condition[position];
            if (value_obj.hasOwnProperty('constant_value')) {
                ret = value_obj.constant_value;
            } else if (value_obj.hasOwnProperty('pds_id')) {
                ret = await module.exports.get_value_by_pi_and_pds(policyInstance.id, value_obj.pds_id);
            } else if (value_obj.hasOwnProperty('offset_pds_id')) {
                ret = await module.exports.get_state_value_offset(policyInstance.id, value_obj.offset_pds_id);
            } else if (value_obj.hasOwnProperty('duration')) {
                ret = await module.exports.get_continue_sec(policyInstance.id, value_obj.duration);
            } else if (value_obj.hasOwnProperty('pv_id')) {
                ret = await module.exports.get_policy_instance_variable(policyInstance.id, value_obj.pv_id);
            }
            return ret;
        }

        async function handleValueCompare(condition) {
            let left_value = await get_value_from_condition(condition, 'left');
            let right_value = await get_value_from_condition(condition, 'right');

            return compareValues(left_value,right_value, condition.operator);
        }

        function compareValues(left, right, operator) {
            const ops = {
                '>': (a, b) => a > b,
                '<': (a, b) => a < b,
                '==': (a, b) => a === b,
                '>=': (a, b) => a >= b,
                '<=': (a, b) => a <= b
            };

            if (!ops[operator]) {
                throw new Error(`不支持的条件判断: ${operator}`);
            }
            return ops[operator](left, right);
        }

        return await evaluateCondition(JSON.parse(conditionJson));
    },
    record_state_init_values: async function (pi) {
        let sq = db_opt.get_sq();
        let pids = await pi.getPolicy_instance_data({
            include: [{ model: sq.models.policy_data_source }],
        });
        for (let pid of pids) {
            pid.value = await this.get_value_by_pi_and_pds(pi.id, pid.policy_data_source.id);
            await pid.save();
        }
    },
    get_state_value_offset: async function (pi_id, pds_id) {
        let sq = db_opt.get_sq();
        let pi = await sq.models.policy_instance.findByPk(pi_id);
        let pids = await pi.getPolicy_instance_data({
            where: { policyDataSourceId: pds_id },
        });
        let orig_value = pids[0] ? pids[0].value : 0;
        let now_value = await this.get_value_by_pi_and_pds(pi_id, pds_id);
        return now_value - orig_value;
    },
    add_policy_variable: async function (pt, name) {
        let exist_record = await pt.getPolicy_variables({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            await pt.createPolicy_variable({
                name: name,
            });
        }
    },
    del_policy_variable: async function (pv_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_variable.findByPk(pv_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    get_policy_instance_variable: async function (pi_id, pv_id) {
        let ret;
        let sq = db_opt.get_sq();
        let pi = await sq.models.policy_instance.findByPk(pi_id);
        let pv = await sq.models.policy_variable.findByPk(pv_id);
        let pivs = await pi.getPolicy_instance_variables({
            where: { policyVariableId: pv.id },
        });
        if (pivs.length == 1) {
            ret = pivs[0].value;
        }

        return ret;
    },
};