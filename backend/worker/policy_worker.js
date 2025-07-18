const moment = require('moment');
const db_opt = require('../lib/db_opt');
const policy_lib = require('../lib/policy_lib');
async function condition_exec(pi, compare_condition) {
    return await policy_lib.shouldTransition(pi, compare_condition)
}

async function do_action(pi, psa) {
    let sq = db_opt.get_sq();
    let pias = await pi.getPolicy_instance_actions({
        where: {
            policyActionNodeId: psa.policy_action_node.id,
        },
        include: [{
            model: sq.models.device,
        }, {
            model: sq.models.policy_action_node,
            include: [{
                model: sq.models.modbus_write_relay,
            }]
        }]
    });
    let pia = pias[0];
    await pia.device.setModbus_write_relay(pia.policy_action_node.modbus_write_relay);
    console.log(`执行动作: ${pia.policy_action_node.name}，设备: ${pia.device.name}`);
}
async function do_variableAssignments(pi, stateNode, actionType) {
    try {
        const assignment = await stateNode.getVariable_assignments({
            order: [['priority', 'ASC']]
        });

        const result = await evaluateExpression(pi, assignment.expression);
            await policy_lib.updatePolicyInstanceVariable(
                    result.piId,
                    result.pvId,
                    result.value
            );
        console.log(`[变量赋值] 类型:${actionType} 变量ID:${assignment.policy_variable_id} 值:${calculatedValue}`);
    } catch (error) {
        console.error(`执行${actionType}类型变量赋值失败:`, error.message);
    }
}
async function evaluateExpression(pi, expression) {

    const expressionJson = typeof expression === 'string'
        ? JSON.parse(expression)
        : expression;

    const piId = pi.id;
    const pvId = expressionJson.pv_id; 

    const context = {
        value: undefined,
        piId,
        pvId,
        ...(expressionJson.pv_id && { pvId: expressionJson.pv_id })
    };

    if (expressionJson.constant_value !== undefined) {
        //处理常量
        context.value = Number(expressionJson.constant_value);
        return context;
    }

    if (expressionJson.pds_id !== undefined) {
        context.value = await policy_lib.get_value_by_pi_and_pds(piId, expressionJson.pds_id);
        return context;
    }

    if (expressionJson.duration !== undefined) {
        context.value = await policy_lib.get_continue_sec(piId, expressionJson.duration);
        return context;
    }

    if(expression.offset_pds_id !== undefined) {
        context.value = await policy_lib.get_state_value_offset(piId, expressionJson.offset_pds_id);
    }

    if (expressionJson.operator && expressionJson.left && expressionJson.right) {
        const leftResult = await evaluateExpression(pi, expressionJson.left);
        const rightResult = await evaluateExpression(pi, expressionJson.right);

        switch (expressionJson.operator) {
            case '+':
                context.value = leftResult.value + rightResult.value;
                break;
            case '-':
                context.value = leftResult.value - rightResult.value;
                break;
            case '*':
                context.value = leftResult.value * rightResult.value;
                break;
            case '/':
                context.value = leftResult.value / rightResult.value;
                break;
            case '%':
                context.value = leftResult.value % rightResult.value;
                break;
            default:
                throw new Error(`不支持的操作符: ${expressionJson.operator}`);
        }

        context.pvId = context.pvId || leftResult.pvId || rightResult.pvId;

        return context;
    }

    throw new Error('无法解析的表达式节点');
}
async function trigger_single_sm(pi_id) {
    let sq = db_opt.get_sq();
    let pi = await sq.models.policy_instance.findByPk(pi_id, {
        include: [
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
                    {
                        model: sq.models.policy_variable_assignment,
                        as: 'doAssignments',
                        separate: true,
                        order: [['priority', 'ASC']]
                    },
                    {
                        model: sq.models.policy_variable_assignment,
                        as: 'enterAssignments',
                        separate: true,
                        order: [['priority', 'ASC']]
                    },
                    {
                        model: sq.models.policy_variable_assignment,
                        as: 'exitAssignments',
                        separate: true,
                        order: [['priority', 'ASC']]
                    }
                ]
            },
        ]

    })
    console.log(`${pi.name}的当前状态： ${pi.policy_state_node.name}`);

    for (let psa of pi.policy_state_node.do_actions) {
        await do_action(pi, psa);
    }
    for (let psa of pi.policy_state_node.doAssignments) {
        await do_variableAssignments(pi, psa, 'do');
    }
    let state_change = false;
    for (let ft of pi.policy_state_node.from_transitions) {
        if (await condition_exec(pi, ft.compare_condition)) {
            let to_state = ft.to_state;
            if (to_state.id != pi.policy_state_node.id) {
                state_change = true;
            }
            console.log(`状态转换: ${pi.policy_state_node.name} -> ${to_state.name}`);
            console.log(`退出状态: ${pi.policy_state_node.name}`);
            for (let psa of pi.policy_state_node.exit_actions) {
                await do_action(pi, psa);
            }
            for (let psa of pi.policy_state_node.exitAssignments) {
                await do_variableAssignments(pi, psa, 'exit');
            }
            await pi.setPolicy_state_node(to_state);
            console.log(`进入状态: ${to_state.name}`);
            let enter_actions = await to_state.getEnter_actions({
                include: [{ model: sq.models.policy_action_node }],
            });
            for (let psa of enter_actions) {
                await do_action(pi, psa);
            }
            for (let psa of to_state.enterAssignments) {
                await do_variableAssignments(pi, psa, 'enter');
            }
            break;
        }
    }
    if (state_change) {
        pi.state_refresh_time = moment().format('YYYY-MM-DD HH:mm:ss');
        await pi.save();
        await policy_lib.record_state_init_values(pi);
        await trigger_single_sm(pi.id);
    }
}
module.exports = {
    trigger_policy_sms: async function () {
        try {
            let sq = db_opt.get_sq();
            let pis = await sq.models.policy_instance.findAll({
                where: {
                    status: '就绪'
                }
            });
            for (let pi of pis) {
                await trigger_single_sm(pi.id);
            }
        } catch (error) {
            console.log(`触发策略状态机时发生错误: ${error.message}`);
        }
    },
};