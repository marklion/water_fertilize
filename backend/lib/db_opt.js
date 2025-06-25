const { Sequelize, DataTypes, Op } = require('sequelize');
const cls = require('cls-hooked');
const namespace = cls.createNamespace('my-very-own-namespace');
Sequelize.useCLS(namespace);
const mysql = require('mysql2/promise');

function getDecimalValue(fieldName) {
    return function () {
        const value = this.getDataValue(fieldName);
        return value === null ? null : parseFloat(value);
    };
}
async function ensureDatabaseExists() {
    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
    const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();
}
function get_db_handle() {
    const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
        dialect: 'mysql',
        dialectModule: require('mysql2'),
        host: process.env.DB_HOST,
        define: {
            freezeTableName: true,
            charset: 'utf8mb4'
        },
        logging: function (sql, time) {
            if (time > 100) {
                console.log(time + '->' + sql);
            }
        },
        benchmark: true,
        pool: {
            max: 10,
            min: 0,
            acquire: 2000,
            idle: 10000
        },
        retry: {
            match: [
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
                /ECONNREFUSED/,
                /EPIPE/,
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            max: 5 // 最大重试次数
        }
    });
    return sequelize;
}
let g_sq;

let db_opt = {
    Op: Op,
    model: {
        rbac_user: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                online_token: { type: DataTypes.STRING },
                online_time: { type: DataTypes.STRING },
                phone: { type: DataTypes.STRING },
                password: { type: DataTypes.STRING },
                fixed: { type: DataTypes.BOOLEAN },
            },
            name: '用户',
        },
        rbac_role: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                description: { type: DataTypes.STRING },
                is_readonly: { type: DataTypes.BOOLEAN, defaultValue: false },
            },
            name: '角色',
        },
        rbac_module: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING, unique: true },
                description: { type: DataTypes.STRING },
            },
            name: '模块',
        },
        company: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
            },
            name: '公司',
        },
        driver: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                type_id: { type: DataTypes.INTEGER, defaultValue: 1 },
            },
            name: '驱动',
        },
        modbus_read_meta: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                title: { type: DataTypes.STRING },
                reg_address: { type: DataTypes.INTEGER },
                data_type: { type: DataTypes.STRING },
            },
            name: 'Modbus读取寄存器配置',
        },
        device: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                connection_key: { type: DataTypes.TEXT },
                error_info: { type: DataTypes.TEXT },
            },
            name: '设备',
        },
        device_data: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                value: { type: DataTypes.DECIMAL(22, 4), defaultValue: 0, get: getDecimalValue('value') },
            },
            name: '设备读数',
        },
        modbus_write_relay: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                action: { type: DataTypes.STRING },
                reg_address: { type: DataTypes.INTEGER },
                value: { type: DataTypes.TEXT },
            },
            name: 'Modbus写入继电器配置',
        },
        policy_template: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
            },
            name: '策略模板',
        },
        policy_data_source: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
            },
            name: '策略数据源',
        },
        policy_action_node: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
            },
            name: '策略动作',
        },
        policy_state_node: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
            },
            name: '策略状态节点',
        },
        policy_state_action: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                priority: { type: DataTypes.INTEGER, defaultValue: 0 },
            },
            name: '状态执行动作',
        },
        policy_state_transition: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                compare_condition: { type: DataTypes.STRING },
                priority: { type: DataTypes.INTEGER, defaultValue: 0 },
            },
            name: '状态转移条件',
        },
        policy_instance: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING },
                status: { type: DataTypes.STRING, defaultValue: '待完善' },
                state_refresh_time: { type: DataTypes.STRING },
            },
            name: '策略实体',
        },
        policy_instance_data: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                value: { type: DataTypes.DECIMAL(22, 4), defaultValue: 0, get: getDecimalValue('value') },
            },
            name: '设备和策略数据源的关联',
        },
        policy_instance_action: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            },
            name: '设备和策略动作的关联',
        },
        policy_variable:{
            define:{
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name:{ type: DataTypes.STRING },
            },
            name: '策略变量',
        },
        policy_instance_variable: {
            define:{
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                value:{type: DataTypes.STRING},
            },
            name: '策略实体变量',
        },
        policy_variable_assignment: {
            define: {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                priority: { type:DataTypes.INTEGER },
                expression: {type:DataTypes.STRING}
            },
            name: '变量赋值规则'
        }
    },
    make_associate: function (_sq) {
        _sq.models.rbac_user.belongsToMany(_sq.models.rbac_role, { through: 'rbac_user_role' });
        _sq.models.rbac_role.belongsToMany(_sq.models.rbac_user, { through: 'rbac_user_role' });
        _sq.models.rbac_role.belongsToMany(_sq.models.rbac_module, { through: 'rbac_role_module' });
        _sq.models.rbac_module.belongsToMany(_sq.models.rbac_role, { through: 'rbac_role_module' });
        _sq.models.rbac_user.belongsTo(_sq.models.company);
        _sq.models.company.hasMany(_sq.models.rbac_user);
        _sq.models.rbac_role.belongsTo(_sq.models.company);
        _sq.models.company.hasMany(_sq.models.rbac_role);
        _sq.models.rbac_module.belongsToMany(_sq.models.company, { through: 'company_module' });
        _sq.models.company.belongsToMany(_sq.models.rbac_module, { through: 'company_module' });

        _sq.models.driver.belongsTo(_sq.models.company);
        _sq.models.company.hasMany(_sq.models.driver);
        _sq.models.modbus_read_meta.belongsTo(_sq.models.driver);
        _sq.models.driver.hasMany(_sq.models.modbus_read_meta);
        _sq.models.device.belongsTo(_sq.models.driver);
        _sq.models.driver.hasMany(_sq.models.device);
        _sq.models.device_data.belongsTo(_sq.models.device);
        _sq.models.device.hasMany(_sq.models.device_data);
        _sq.models.device_data.belongsTo(_sq.models.modbus_read_meta)
        _sq.models.modbus_read_meta.hasMany(_sq.models.device_data);
        _sq.models.modbus_write_relay.belongsTo(_sq.models.driver);
        _sq.models.driver.hasMany(_sq.models.modbus_write_relay);
        _sq.models.device.belongsTo(_sq.models.modbus_write_relay);
        _sq.models.modbus_write_relay.hasMany(_sq.models.device);
        _sq.models.device.belongsTo(_sq.models.company);
        _sq.models.company.hasMany(_sq.models.device);

        _sq.models.policy_template.belongsTo(_sq.models.company);
        _sq.models.company.hasMany(_sq.models.policy_template);
        _sq.models.policy_data_source.belongsTo(_sq.models.policy_template);
        _sq.models.policy_template.hasMany(_sq.models.policy_data_source);
        _sq.models.policy_data_source.belongsTo(_sq.models.modbus_read_meta);
        _sq.models.modbus_read_meta.hasMany(_sq.models.policy_data_source);
        _sq.models.policy_action_node.belongsTo(_sq.models.policy_template);
        _sq.models.policy_template.hasMany(_sq.models.policy_action_node);
        _sq.models.policy_action_node.belongsTo(_sq.models.modbus_write_relay);
        _sq.models.modbus_write_relay.hasMany(_sq.models.policy_action_node);

        _sq.models.policy_state_node.belongsTo(_sq.models.policy_template);
        _sq.models.policy_template.hasMany(_sq.models.policy_state_node);
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_state_node, { as: 'enter_state', foreignKey: 'enterStateId' });
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_state_node, { as: 'do_state', foreignKey: 'doStateId' });
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_state_node, { as: 'exit_state', foreignKey: 'exitStateId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_action, { as: 'enter_actions', foreignKey: 'enterStateId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_action, { as: 'do_actions', foreignKey: 'doStateId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_action, { as: 'exit_actions', foreignKey: 'exitStateId' });
        _sq.models.policy_variable_assignment.belongsTo(_sq.models.policy_state_node, { as: 'enter_assignment', foreignKey: 'enterAssignmentId' });
        _sq.models.policy_variable_assignment.belongsTo(_sq.models.policy_state_node, { as: 'do_assignment', foreignKey: 'doAssignmentId' });
        _sq.models.policy_variable_assignment.belongsTo(_sq.models.policy_state_node, { as: 'exit_assignment', foreignKey: 'exitAssignmentId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_variable_assignment, { as: 'enterAssignment', foreignKey: 'enterAssignmentId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_variable_assignment, { as: 'doAssignment', foreignKey: 'doAssignmentId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_variable_assignment, { as: 'exitAssignment', foreignKey: 'exitAssignmentId' });
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_action_node);
        _sq.models.policy_action_node.hasMany(_sq.models.policy_state_action);
        _sq.models.policy_state_transition.belongsTo(_sq.models.policy_state_node, { as: 'from_state', foreignKey: 'fromStateId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_transition, { as: 'from_transitions', foreignKey: 'fromStateId' });
        _sq.models.policy_state_transition.belongsTo(_sq.models.policy_state_node, { as: 'to_state', foreignKey: 'toStateId' });
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_transition, { as: 'to_transitions', foreignKey: 'toStateId' });

        _sq.models.policy_instance.belongsTo(_sq.models.policy_template);
        _sq.models.policy_template.hasMany(_sq.models.policy_instance);
        _sq.models.policy_instance.belongsTo(_sq.models.policy_state_node);
        _sq.models.policy_state_node.hasMany(_sq.models.policy_instance);
        _sq.models.policy_instance.belongsTo(_sq.models.company);
        _sq.models.company.hasMany(_sq.models.policy_instance);
        _sq.models.policy_instance_data.belongsTo(_sq.models.policy_instance);
        _sq.models.policy_instance.hasMany(_sq.models.policy_instance_data);
        _sq.models.policy_instance_action.belongsTo(_sq.models.policy_instance);
        _sq.models.policy_instance.hasMany(_sq.models.policy_instance_action);
        _sq.models.policy_instance_data.belongsTo(_sq.models.policy_data_source);
        _sq.models.policy_data_source.hasMany(_sq.models.policy_instance_data);
        _sq.models.policy_instance_action.belongsTo(_sq.models.policy_action_node);
        _sq.models.policy_action_node.hasMany(_sq.models.policy_instance_action);
        _sq.models.policy_instance_data.belongsTo(_sq.models.device);
        _sq.models.device.hasMany(_sq.models.policy_instance_data);
        _sq.models.policy_instance_action.belongsTo(_sq.models.device);
        _sq.models.device.hasMany(_sq.models.policy_instance_action);

        _sq.models.policy_variable.belongsTo(_sq.models.policy_template);
        _sq.models.policy_template.hasMany(_sq.models.policy_variable);
        _sq.models.policy_instance_variable.belongsTo(_sq.models.policy_instance);
        _sq.models.policy_instance.hasMany(_sq.models.policy_instance_variable);
        _sq.models.policy_instance_variable.belongsTo(_sq.models.policy_variable);
        _sq.models.policy_variable.hasMany(_sq.models.policy_instance_variable);
    },
    add_del_hook: function (sq, model_name) {
        sq.models[model_name].addHook('beforeDestroy', async (instance, options) => {
            let has_many_rels = Object.values(sq.models[model_name].associations).filter(assoc => {
                return assoc.associationType === 'HasMany' && assoc.source.name === model_name;
            });
            for (let assoc of has_many_rels) {
                const children = await assoc.target.count({
                    where: {
                        [assoc.foreignKey]: instance.id,
                    },
                    transaction: options.transaction
                });
                if (children > 0) {
                    throw {
                        err_msg: `无法删除${this.model[model_name].name}，请先删除相关联的${this.model[assoc.target.name].name}。`,
                    };
                }
            }
        });
    },
    install: async function () {
        await ensureDatabaseExists();
        let sq = this.get_sq();
        Object.keys(this.model).forEach((key) => {
            sq.define(key, this.model[key].define, { paranoid: true });
        });
        this.make_associate(sq);
        Object.keys(this.model).forEach((key) => {
            this.add_del_hook(sq, key);
        });
        await sq.sync({ alter: { drop: false } });
        g_sq = sq;
    },
    get_sq: function () {
        let ret = null;
        if (!g_sq) {
            g_sq = get_db_handle();
        }
        ret = g_sq;

        return ret;
    }
};

module.exports = db_opt;