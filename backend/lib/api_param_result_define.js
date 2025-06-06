module.exports = {
    user_info: {
        id: { type: Number, mean: 'ID', example: 1 },
        name: { type: String, mean: '用户名称', example: '张三' },
        phone:{ type: String, mean: '手机号', example: '13800138000' },
        company:{
            type: Object,
            mean: '公司信息',
            explain:{
                id: { type: Number, mean: '公司ID', example: 1 },
                name: { type: String, mean: '公司名称', example: '公司A' },
            }
        },
    },
    company_info: {
        id: { type: Number, mean: '公司ID', example: 1 },
        name: { type: String, mean: '公司名称', example: '公司A' },
    },
    driver_info:{
        id: { type: Number, mean: '驱动ID', example: 1 },
        name: { type: String, mean: '驱动名称', example: '驱动A' },
        type_id: { type: Number, mean: '驱动类型ID', example: 1 },
        modbus_read_meta:{
            type: Array,
            mean: 'Modbus读取元数据列表',
            explain: {
                id: { type: Number, mean: '元数据ID', example: 1 },
                title: { type: String, mean: '元数据标题', example: '温度' },
                reg_address: { type: Number, mean: '寄存器地址', example: 100 },
                data_type: { type: String, mean: '数据类型', example: 'int16' },
            }
        },
        modbus_write_relays:{
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
    device_info:{
        id: { type: Number, mean: '设备ID', example: 1 },
        name: { type: String, mean: '设备名称', example: '设备A' },
        connection_key: { type: String, mean: '连接密钥', example: '123456' },
        driver_id: { type: Number, mean: '驱动ID', example: 1 },
        driver:{
            type: Object,
            mean: '驱动信息',
            explain: {
                id: { type: Number, mean: '驱动ID', example: 1 },
                name: { type: String, mean: '驱动名称', example: '驱动A' },
                type_id: { type: Number, mean: '驱动类型ID', example: 1 },
                modbus_write_relays:{
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
        device_data:{
            type: Array,
            mean: '设备数据列表',
            explain:{
                id:{type:Number, mean:'数据ID', example:1},
                value:{type:Number, mean:'数据值', example:100.0},
                modbus_read_metum:{
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
        device_actions:{
            type: Array,
            mean: '设备动作列表',
            explain: {
                id: { type: Number, mean: '动作ID', example: 1 },
                modbus_write_relay:{
                    type: Object,
                    mean: 'Modbus写入继电器',
                    explain: {
                        id: { type: Number, mean: '继电器ID', example: 1 },
                        action: { type: String, mean: '动作', example: '开' },
                        reg_address: { type: Number, mean: '寄存器地址', example: 200 },
                        value: { type: String, mean: '值', example: '1' },
                    }
                },
            }
        },
    },
}