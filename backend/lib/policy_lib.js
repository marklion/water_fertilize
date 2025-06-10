const db_opt = require('./db_opt');
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
        let ret = await sq.models.policy_template.findAndCountAll({
            where: { companyId: company.id },
            limit: pageSize,
            offset: offset,
            order: [['id', 'DESC']],
            distinct: true,
            include: [
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
    add_policy_instance: async function (policy_template, name) {
        let exist_record = await policy_template.getPolicy_instances({
            where: { name: name },
        });
        if (exist_record.length == 0) {
            let new_record = await policy_template.createPolicy_instance({
                name: name,
            });
            let state_nodes = await policy_template.getPolicy_state_nodes();
            if (state_nodes.length > 0) {
                await new_record.setPolicy_state_node(state_nodes[0]);
            }
        }
    },
    del_policy_instance: async function (pi_id) {
        let sq = db_opt.get_sq();
        let exist_record = await sq.models.policy_instance.findByPk(pi_id);
        if (exist_record) {
            await exist_record.destroy();
        }
    },
    get_policy_instances: async function (company, pageNo) {
        let sq = db_opt.get_sq();
        let pageSize = 20;
        let offset = pageNo * pageSize;
        let ret = await sq.models.policy_instance.findAndCountAll({
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
                    required:true,
                    where:{
                        companyId: company.id
                    },
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
        }
        policy_instance.status = status;
        await policy_instance.save();
    },
};