const moment = require('moment');
const db_opt = require('../lib/db_opt');
const policy_lib = require('../lib/policy_lib');
async function condition_exec(pi, compare_condition) {
    let data_source_id = parseInt(compare_condition)
    let value = await policy_lib.get_value_by_pi_and_pid(pi.id, data_source_id);
    console.log(`数据源ID(${data_source_id})的值是${value}`);
    let stay_sec = await policy_lib.get_continue_sec(pi.id);
    console.log(`持续时间是${stay_sec}秒`);


    if (!condition_exec.counter) {
        condition_exec.counter = 0;
    }
    condition_exec.counter++;
    if (condition_exec.counter % 10 === 0) {
        return true;
    }
    return false;
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
                ]
            },
        ]

    })
    console.log(`${pi.name}的当前状态： ${pi.policy_state_node.name}`);

    for (let psa of pi.policy_state_node.do_actions) {
        await do_action(pi, psa);
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
            await pi.setPolicy_state_node(to_state);
            console.log(`进入状态: ${to_state.name}`);
            let enter_actions = await to_state.getEnter_actions({
                include: [{ model: sq.models.policy_action_node }],
            });
            for (let psa of enter_actions) {
                await do_action(pi, psa);
            }
            break;
        }
    }
    if (state_change) {
        pi.state_refresh_time = moment().format('YYYY-MM-DD HH:mm:ss');
        await pi.save();
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