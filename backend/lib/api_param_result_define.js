function make_aprd() {
    let policy_action_node_info = {
        id: { type: Number, mean: '动作节点ID', example: 1 },
        name: { type: String, mean: '动作节点名称', example: '开灯' },
        modbus_write_relay: {
            type: Object,
            mean: 'Modbus写入继电器',
            explain: {
                id: { type: Number, mean: '继电器ID', example: 1 },
                action: { type: String, mean: '动作', example: '开' },
                driver: {
                    type: Object,
                    mean: '驱动信息',
                    explain: {
                        id: { type: Number, mean: '驱动ID', example: 1 },
                        name: { type: String, mean: '驱动名称', example: '驱动A' },
                    },
                },
            }
        },
    };
    let policy_state_action_info = {
        id: { type: Number, mean: '状态动作ID', example: 1 },
        priority: { type: Number, mean: '优先级', example: 1 },
        policy_action_node: {
            type: Object,
            mean: '策略动作节点',
            explain: policy_action_node_info,
        },
    };
    let policy_data_source_info = {
        id: { type: Number, mean: '数据源ID', example: 1 },
        name: { type: String, mean: '数据源名称', example: '温度传感器' },
        modbus_read_metum: {
            type: Object,
            mean: 'Modbus读取元数据',
            explain: {
                id: { type: Number, mean: '元数据ID', example: 1 },
                title: { type: String, mean: '元数据标题', example: '温度' },
                driver: {
                    type: Object,
                    mean: '驱动信息',
                    explain: {
                        id: { type: Number, mean: '驱动ID', example: 1 },
                        name: { type: String, mean: '驱动名称', example: '驱动A' },
                    },
                },
            },
        },
    };
    let policy_state_node_info = {
        id: { type: Number, mean: '状态节点ID', example: 1 },
        name: { type: String, mean: '状态节点名称', example: '温度正常' },
        enter_actions: {
            type: Array,
            mean: '进入动作列表',
            explain: policy_state_action_info,
        },
        do_actions: {
            type: Array,
            mean: '执行动作列表',
            explain: policy_state_action_info,
        },
        exit_actions: {
            type: Array,
            mean: '退出动作列表',
            explain: policy_state_action_info,
        },
        from_transitions: {
            type: Array,
            mean: '状态转换列表',
            explain: {
                id: { type: Number, mean: '转换ID', example: 1 },
                to_state: {
                    type: Object,
                    mean: '目标状态节点',
                    explain: {
                        id: { type: Number, mean: '状态节点ID', example: 1 },
                        name: { type: String, mean: '状态节点名称', example: '温度正常' },
                    },
                },
                compare_condition: { type: String, mean: '比较条件', example: '>' },
                priority: { type: Number, mean: '优先级', example: 1 },
            }
        },
    };
    return {
        user_info: {
            id: { type: Number, mean: 'ID', example: 1 },
            name: { type: String, mean: '用户名称', example: '张三' },
            phone: { type: String, mean: '手机号', example: '13800138000' },
            company: {
                type: Object,
                mean: '公司信息',
                explain: {
                    id: { type: Number, mean: '公司ID', example: 1 },
                    name: { type: String, mean: '公司名称', example: '公司A' },
                }
            },
        },
        company_info: {
            id: { type: Number, mean: '公司ID', example: 1 },
            name: { type: String, mean: '公司名称', example: '公司A' },
        },
        driver_info: {
            id: { type: Number, mean: '驱动ID', example: 1 },
            name: { type: String, mean: '驱动名称', example: '驱动A' },
            type_id: { type: Number, mean: '驱动类型ID', example: 1 },
            modbus_read_meta: {
                type: Array,
                mean: 'Modbus读取元数据列表',
                explain: {
                    id: { type: Number, mean: '元数据ID', example: 1 },
                    title: { type: String, mean: '元数据标题', example: '温度' },
                    reg_address: { type: Number, mean: '寄存器地址', example: 100 },
                    data_type: { type: String, mean: '数据类型', example: 'int16' },
                }
            },
            modbus_write_relays: {
                type: Array,
                mean: 'Modbus写入继电器列表',
                explain: {
                    id: { type: Number, mean: '继电器ID', example: 1 },
                    action: { type: String, mean: '动作', example: '开' },
                    reg_address: { type: Number, mean: '寄存器地址', example: 200 },
                    value: { type: String, mean: '值', example: '1' },
                }
            },
        },
        device_info: {
            id: { type: Number, mean: '设备ID', example: 1 },
            name: { type: String, mean: '设备名称', example: '设备A' },
            connection_key: { type: String, mean: '连接密钥', example: '123456' },
            error_info:{type: String, mean: '错误信息', example: '无'},
            driver_id: { type: Number, mean: '驱动ID', example: 1 },
            driver: {
                type: Object,
                mean: '驱动信息',
                explain: {
                    id: { type: Number, mean: '驱动ID', example: 1 },
                    name: { type: String, mean: '驱动名称', example: '驱动A' },
                    type_id: { type: Number, mean: '驱动类型ID', example: 1 },
                    modbus_write_relays: {
                        type: Array,
                        mean: 'Modbus写入继电器列表',
                        explain: {
                            id: { type: Number, mean: '继电器ID', example: 1 },
                            action: { type: String, mean: '动作', example: '开' },
                            reg_address: { type: Number, mean: '寄存器地址', example: 200 },
                            value: { type: String, mean: '值', example: '1' },
                        }
                    },
                }
            },
            device_data: {
                type: Array,
                mean: '设备数据列表',
                explain: {
                    id: { type: Number, mean: '数据ID', example: 1 },
                    value: { type: Number, mean: '数据值', example: 100.0 },
                    modbus_read_metum: {
                        type: Object,
                        mean: 'Modbus读取元数据',
                        explain: {
                            id: { type: Number, mean: '元数据ID', example: 1 },
                            title: { type: String, mean: '元数据标题', example: '温度' },
                            reg_address: { type: Number, mean: '寄存器地址', example: 100 },
                            data_type: { type: String, mean: '数据类型', example: 'int16' },
                        }
                    },
                }
            },
            modbus_write_relay: {
                type: Object,
                mean: 'Modbus写入继电器',
                explain: {
                    id: { type: Number, mean: '继电器ID', example: 1 },
                    action: { type: String, mean: '动作', example: '开' },
                    reg_address: { type: Number, mean: '寄存器地址', example: 200 },
                    value: { type: String, mean: '值', example: '1' },
                }
            },
        },
        policy_data_source_info: policy_data_source_info,
        policy_action_node_info: policy_action_node_info,
        policy_state_action_info: policy_state_action_info,
        policy_state_node_info: policy_state_node_info,
        policy_template_info: {
            id: { type: Number, mean: '策略模板ID', example: 1 },
            name: { type: String, mean: '策略模板名称', example: '温度控制策略' },
            policy_data_sources: {
                type: Array,
                mean: '策略数据源列表',
                explain: policy_data_source_info,
            },
            policy_action_nodes: {
                type: Array,
                mean: '策略动作节点列表',
                explain: policy_action_node_info,
            },
            policy_state_nodes: {
                type: Array,
                mean: '策略状态节点列表',
                explain: policy_state_node_info,
            },
        },
        policy_instance_info:{
            id: { type: Number, mean: '策略实例ID', example: 1 },
            name: { type: String, mean: '策略实例名称', example: '温度控制实例' },
            status: { type: String, mean: '策略实例状态', example: '运行中' },
            policy_template: {
                type: Object,
                mean: '策略模板信息',
                explain: {
                    id: { type: Number, mean: '策略模板ID', example: 1 },
                    name: { type: String, mean: '策略模板名称', example: '温度控制策略' },
                    policy_data_sources: {
                        type: Array,
                        mean: '策略数据源列表',
                        explain: policy_data_source_info,
                    },
                    policy_action_nodes: {
                        type: Array,
                        mean: '策略动作节点列表',
                        explain: policy_action_node_info,
                    },
                }
            },
            policy_state_nodes:{
                type: Array,
                mean: '策略状态节点列表',
                explain: {
                    id:policy_state_node_info.id,
                    name:policy_state_node_info.name
                },
            },
            policy_instance_data:{
                type: Array,
                mean: '策略实例数据列表',
                explain: {
                    id: { type: Number, mean: '数据ID', example: 1 },
                    policy_data_source: {
                        type: Object,
                        mean: '策略数据源',
                        explain: {
                            id: policy_data_source_info.id,
                            name: policy_data_source_info.name,
                        }
                    },
                    device:{
                        type: Object,
                        mean: '设备信息',
                        explain: {
                            id: { type: Number, mean: '设备ID', example: 1 },
                            name: { type: String, mean: '设备名称', example: '设备A' },
                        }
                    },
                }
            },
            policy_instance_actions:{
                type: Array,
                mean: '策略实例动作列表',
                explain: {
                    id: { type: Number, mean: '动作ID', example: 1 },
                    policy_action_node: {
                        type: Object,
                        mean: '策略动作节点',
                        explain: {
                            id: policy_action_node_info.id,
                            name: policy_action_node_info.name,
                        },
                    },
                    device: {
                        type: Object,
                        mean: '设备信息',
                        explain: {
                            id: { type: Number, mean: '设备ID', example: 1 },
                            name: { type: String, mean: '设备名称', example: '设备A' },
                        }
                    },
                }
            },
        },
        policy_instance_runtime_info: {
            id: { type: Number, mean: '策略实例运行时ID', example: 1 },
            name: { type: String, mean: '策略实例名称', example: '温度控制实例' },
            template_name:{type: String, mean: '策略模板名称', example: '温度控制策略'},
            state_name: { type: String, mean: '当前状态名称', example: '温度正常' },
            data:{type: Array, mean: '策略实例数据列表', explain: {
                id: { type: Number, mean: '数据ID', example: 1 },
                data_source_name: { type: String, mean: '数据源名称', example: '温度传感器' },
                value: { type: Number, mean: '数据值', example: 25.1},
                init_value: { type: Number, mean: '初始值', example: 0 },
            }},
            actions:{
                type: Array,
                mean: '策略实例动作列表',
                explain: {
                    id: { type: Number, mean: '动作ID', example: 1 },
                    action_node_name: { type: String, mean: '动作节点名称', example: '开灯' },
                    do: { type: Boolean, mean: '是否执行', example: true },
                }
            },
        },
    };
}
module.exports = make_aprd();