const { Sequelize, DataTypes, Op } = require('sequelize');
const cls = require('cls-hooked');
const namespace = cls.createNamespace('my-very-own-namespace');
Sequelize.useCLS(namespace);
const mysql = require('mysql2/promise');

function getDecimalValue(fieldName) {
    return function() {
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
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING },
            online_token: { type: DataTypes.STRING },
            online_time: { type: DataTypes.STRING },
            phone: { type: DataTypes.STRING},
            password: { type: DataTypes.STRING },
            fixed: { type: DataTypes.BOOLEAN },
        },
        rbac_role: {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING },
            description: { type: DataTypes.STRING },
            is_readonly: { type: DataTypes.BOOLEAN, defaultValue: false },
        },
        rbac_module: {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING, unique: true },
            description: { type: DataTypes.STRING },
        },
        company: {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING },
        },
        driver:{
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name:{ type: DataTypes.STRING},
            type_id:{type: DataTypes.INTEGER, defaultValue: 1},
        },
        modbus_read_meta:{
            id:{ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            title:{ type: DataTypes.STRING},
            reg_address:{ type: DataTypes.INTEGER},
            data_type:{ type: DataTypes.STRING},
        },
        device:{
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING },
            connection_key: { type: DataTypes.TEXT },
        },
        device_data:{
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            value:{ type: DataTypes.DECIMAL(22, 4), defaultValue:0, get:getDecimalValue('value')},
        },
        modbus_write_relay:{
            id:{ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            action:{ type: DataTypes.STRING},
            reg_address:{ type: DataTypes.INTEGER},
            value:{ type: DataTypes.TEXT},
        },
        policy_template:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name:{type: DataTypes.STRING},
        },
        policy_data_source:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name:{type: DataTypes.STRING},
        },
        policy_action_node:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name:{type: DataTypes.STRING},
        },
        policy_state_node:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name:{type: DataTypes.STRING},
        },
        policy_state_action:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            priority:{type: DataTypes.INTEGER, defaultValue: 0},
        },
        policy_state_transition:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name:{type: DataTypes.STRING},
            compare_condition:{type: DataTypes.STRING},
            priority:{type: DataTypes.INTEGER, defaultValue: 0},
        },
        policy_instance:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name:{type: DataTypes.STRING},
            status:{type: DataTypes.STRING, defaultValue: '待完善'},
        },
        policy_instance_data:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        },
        policy_instance_action:{
            id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        },
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
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_state_node, {as:'enter_state', foreignKey: 'enterStateId'});
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_state_node, {as:'do_state', foreignKey: 'doStateId'});
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_state_node, {as:'exit_state', foreignKey: 'exitStateId'});
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_action, {as:'enter_actions', foreignKey: 'enterStateId'});
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_action, {as:'do_actions', foreignKey: 'doStateId'});
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_action, {as:'exit_actions', foreignKey: 'exitStateId'});
        _sq.models.policy_state_action.belongsTo(_sq.models.policy_action_node);
        _sq.models.policy_action_node.hasMany(_sq.models.policy_state_action);
        _sq.models.policy_state_transition.belongsTo(_sq.models.policy_state_node, {as: 'from_state', foreignKey: 'fromStateId'});
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_transition, {as: 'from_transitions', foreignKey: 'fromStateId'});
        _sq.models.policy_state_transition.belongsTo(_sq.models.policy_state_node, {as: 'to_state', foreignKey: 'toStateId'});
        _sq.models.policy_state_node.hasMany(_sq.models.policy_state_transition, {as: 'to_transitions', foreignKey: 'toStateId'});

        _sq.models.policy_instance.belongsTo(_sq.models.policy_template);
        _sq.models.policy_template.hasMany(_sq.models.policy_instance);
        _sq.models.policy_instance.belongsTo(_sq.models.policy_state_node);
        _sq.models.policy_state_node.hasMany(_sq.models.policy_instance);
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
    },
    install: async function () {
        console.log('run install');
        await ensureDatabaseExists();
        let sq = this.get_sq();
        Object.keys(this.model).forEach((key) => {
            sq.define(key, this.model[key], { paranoid: true });
        });
        this.make_associate(sq);
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