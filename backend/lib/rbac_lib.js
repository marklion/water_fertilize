const db_opt = require('./db_opt');
const moment = require('moment');

module.exports = {
    get_user_by_token: async function (_token) {
        let sq = db_opt.get_sq();
        let user = await sq.models.rbac_user.findOne({
            where: { online_token: _token },
        });
        if (user && !user.fixed) {
            let now = moment();
            let last = moment(user.online_time);
            if (now.diff(last, 'day') < 20) {
                if (now.diff(last, 'day') > 1) {
                    user.online_time = now.format('YYYY-MM-DD HH:mm:ss');
                    await user.save();
                }
            }
            else {
                user = null;
            }
        }

        return user;
    },
    change_password: async function (token, _new_password) {
        if (_new_password == process.env.DEFAULT_PWD) {
            throw { err_msg: '密码不合法' };
        }
        let user = await this.get_user_by_token(token);
        user.password = _new_password;
        await user.save();
    },
    rbac_check: async function (_online_token, _req_module, _is_write) {
        let ret = '未登录';
        let sq = db_opt.get_sq();
        if (!_online_token) {
            return ret;
        }
        let user = await this.get_user_by_token(_online_token);
        if (user) {
            let module_desc = (await sq.models.rbac_module.findOne({where:{name:_req_module}})).description;
            ret = '无权限，需要<' + module_desc + '>模块的' + (_is_write ? '写' : '读') + '权限';
            let roles = await user.getRbac_roles();
            for (let i = 0; i < roles.length; i++) {
                let modules = await roles[i].getRbac_modules();
                for (let j = 0; j < modules.length; j++) {
                    if (modules[j].name == _req_module) {
                        if (_is_write) {
                            if (roles[i].is_readonly) {
                                ret = '只读用户';
                            }
                            else {
                                ret = '';
                                break;
                            }
                        }
                        else {
                            ret = '';
                            break
                        }
                    }
                }
                if (ret.length == 0) {
                    break;
                }
            }

        }

        return ret;
    },
    get_company_by_token: async function (_token) {
        let user = await this.get_user_by_token(_token);
        let company = null;
        if (user) {
            company = await user.getCompany();
        }
        return company;
    },
    bind_company2module: async function (_company_id, _module_id) {
        let sq = db_opt.get_sq();
        let company = await sq.models.company.findByPk(_company_id);
        let module = await sq.models.rbac_module.findByPk(_module_id);
        if (company && module) {
            if (!await company.hasRbac_module(module)) {
                await company.addRbac_module(module);
            }
        }
    },
    unbind_company2module: async function (_company_id, _module_id) {
        let sq = db_opt.get_sq();
        let company = await sq.models.company.findByPk(_company_id);
        let module = await sq.models.rbac_module.findByPk(_module_id);
        if (company && module) {
            if (await company.hasRbac_module(module)) {
                await company.removeRbac_module(module);
            }
        }
    },
    bind_all_modules2company:async function(company) {
        let sq = db_opt.get_sq();
        let modules = await sq.models.rbac_module.findAll();
        for (let index = 0; index < modules.length; index++) {
            const element = modules[index];
            if (!await company.hasRbac_module(element) && element.name != 'global') {
                await company.addRbac_module(element);
            }
        }
    },
    add_module: async function (_name, _description) {
        let sq = db_opt.get_sq();
        let one = await sq.models.rbac_module.findOrCreate({
            where: { name: _name },
            defaults: {
                name: _name,
            },
        });
        one[0].description = _description;
        await one[0].save();
        return one[0];
    },
    add_role: async function (_name, _description, _is_readonly, company) {
        let sq = db_opt.get_sq();
        let ret = null;
        if (company) {
            if (_name == 'admin') {
                throw { err_msg: '不允许创建名为admin的角色' };
            }
            let match_role = await company.getRbac_roles({
                where: {
                    name: _name,
                },
            });
            if (match_role.length == 1) {
                match_role[0].description = _description;
                match_role[0].is_readonly = _is_readonly;
                await match_role[0].save();
                ret = match_role[0];
            }
            else {
                ret = await company.createRbac_role({
                    name: _name,
                    description: _description,
                    is_readonly: _is_readonly,
                });
            }
        }
        else {
            let found_one = await sq.models.rbac_role.findOrCreate({
                where: { name: _name },
                defaults: {
                    name: _name,
                    description: _description,
                    is_readonly: _is_readonly,
                },
            });
            found_one[0].description = _description;
            found_one[0].is_readonly = _is_readonly;
            await found_one[0].save();
            ret = found_one[0];
        }
        return ret;
    },
    del_role: async function (_id, _company) {
        let sq = db_opt.get_sq();
        let one = await sq.models.rbac_role.findByPk(_id);
        if (one && await _company.hasRbac_role(one)) {
            await one.destroy();
        }
    },
    add_user: async function (_phone) {
        let sq = db_opt.get_sq();
        let one = await sq.models.rbac_user.findOrCreate({
            where: { phone: _phone },
            defaults: {
                phone: _phone,
            },
        });
        await one[0].save();
        return one[0];
    },
    del_user: async function (_id) {
        let sq = db_opt.get_sq();
        let one = await sq.models.rbac_user.findByPk(_id);
        if (one) {
            await one.destroy();
        }
    },
    connect_user2role: async function (_user_id, _role_id) {
        let sq = db_opt.get_sq();
        let user = await sq.models.rbac_user.findByPk(_user_id);
        let role = await sq.models.rbac_role.findByPk(_role_id);
        if (! await user.hasRbac_role(role)) {
            await user.addRbac_role(role);
        }
    },
    disconnect_user2role: async function (_user_id, _role_id) {
        let sq = db_opt.get_sq();
        let user = await sq.models.rbac_user.findByPk(_user_id);
        let role = await sq.models.rbac_role.findByPk(_role_id);
        if (await user.hasRbac_role(role)) {
            await user.removeRbac_role(role);
        }
    },
    connect_role2module: async function (_role_id, _module_id) {
        let sq = db_opt.get_sq();
        let role = await sq.models.rbac_role.findByPk(_role_id);
        let module = await sq.models.rbac_module.findByPk(_module_id);
        if (! await role.hasRbac_module(module)) {
            await role.addRbac_module(module);
        }
    },
    disconnect_role2module: async function (_role_id, _module_id) {
        let sq = db_opt.get_sq();
        let role = await sq.models.rbac_role.findByPk(_role_id);
        let module = await sq.models.rbac_module.findByPk(_module_id);
        if (await role.hasRbac_module(module)) {
            await role.removeRbac_module(module);
        }
    },
    make_company_admin_role: async function (_company) {
        let sq = db_opt.get_sq();
        let role = await this.add_role('公司管理员', '公司内最高权限', false, _company);
        if (role) {
            let modules = await sq.models.rbac_module.findAll();
            for (let index = 0; index < modules.length; index++) {
                let element = modules[index];
                if (element.name != 'global') {
                    await this.connect_role2module(role.id, element.id);
                }
            }
        }

        return role;
    },
    get_all_roles: async function (_company, _pageNo) {
        let sq = db_opt.get_sq();
        let roles = [];
        let count = 0;
        let condition = {
            order: [['id', 'ASC']],
            limit: 20,
            offset: _pageNo * 20,
        };
        if (_company) {
            roles = await _company.getRbac_roles(condition);
            count = await _company.countRbac_roles();
        }
        else {
            roles = await sq.models.rbac_role.findAll(condition);
            count = await sq.models.rbac_role.count();
        }
        let rows = [];
        for (let index = 0; index < roles.length; index++) {
            let element = roles[index];
            let role = element.toJSON();
            role.related_users = [];
            role.related_modules = [];
            (await element.getRbac_users()).forEach((itr) => {
                role.related_users.push(itr.toJSON());
            });
            (await element.getRbac_modules()).forEach((itr) => {
                role.related_modules.push(itr.toJSON());
            });
            let company = await element.getCompany();
            if (company) {
                role.belong_company = company.name;
            }
            rows.push(role);
        }
        return { count, rows }
    },
    get_all_modules: async function (_pageNo, token) {
        let sq = db_opt.get_sq();
        let condition = {
            order: [['id', 'ASC']],
            limit: 20,
            offset: _pageNo * 20,
        };
        let ret = [];
        let count = 0;
        let user = await this.get_user_by_token(token);
        let _company = await this.get_company_by_token(token);
        if (_company && user && user.phone != '18911992582') {
            ret = await _company.getRbac_modules(condition);
            count = await _company.countRbac_modules();
        }
        else {
            ret = await sq.models.rbac_module.findAll(condition);
            count = await sq.models.rbac_module.count();
        }
        return { count, rows: ret };
    },
    get_all_users: async function (_company, _pageNo) {
        let sq = db_opt.get_sq();
        let users = [];
        let count = 0;
        let condition = {
            order: [['id', 'ASC']],
            limit: 20,
            offset: _pageNo * 20,
        };
        if (_company && _company.id) {
            users = await _company.getRbac_users(condition);
            count = await _company.countRbac_users();
        }
        else {
            users = await sq.models.rbac_user.findAll(condition);
            count = await sq.models.rbac_user.count();
        }

        let rows = [];
        for (let index = 0; index < users.length; index++) {
            let element = users[index];
            let user = element.toJSON();
            user.roles = [];
            (await element.getRbac_roles()).forEach((itr) => {
                user.roles.push(itr.toJSON());
            });
            rows.push(user);
        }
        return { count, rows: users }
    },
    user_login: async function (_phone) {
        let ret = '';
        let sq = db_opt.get_sq();
        let user = await sq.models.rbac_user.findOne({
            where: { phone: _phone },
        });
        if (user) {
            if (!user.online_token) {
                const uuid = require('uuid');
                user.online_token = uuid.v4();
            }
            user.online_time = moment().format('YYYY-MM-DD HH:mm:ss');
            await user.save();
            ret = user.online_token;
        }
        return ret;
    },
    user_bind_company: async function (user, company, open_id, name, email) {
        await user.setCompany(company);
        user.open_id = open_id;
        user.name = name;
        user.email = email;
        let cust_role = await this.add_role('一般用户', '一般用户', false, company);
        await this.connect_user2role(user.id, cust_role.id);
        await this.connect_role2module(cust_role.id, (await db_opt.get_sq().models.rbac_module.findOne({ where: { name: 'customer' } })).id);
        await this.connect_role2module(cust_role.id, (await db_opt.get_sq().models.rbac_module.findOne({ where: { name: 'supplier' } })).id);
        let old_user = await db_opt.get_sq().models.rbac_user.findOne({
            where: {
                [db_opt.Op.and]: [{ open_id: open_id }, { id: { [db_opt.Op.ne]: user.id } }]
            }
        });
        if (old_user) {
            old_user.open_id = '';
            await old_user.save();
        }
        await user.save();
    },
    clear_user_bind_info: async function (user) {
        let urs = await user.getRbac_roles();
        for (let index = 0; index < urs.length; index++) {
            const element = urs[index];
            await this.disconnect_user2role(user.id, element.id);
        }
    },
    get_admin_company:async function() {
        let sq = db_opt.get_sq();
        let admin_company = await sq.models.company.findOne({
            where: { is_admin: true },
            order: [['id', 'ASC']],
        });
        return admin_company;
    },
};