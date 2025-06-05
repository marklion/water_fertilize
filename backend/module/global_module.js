const db_opt = require('../lib/db_opt');
const rbac_lib = require('../lib/rbac_lib');
const api_param_result_define = require('../lib/api_param_result_define');
module.exports = {
    name: 'global',
    description: '全局',
    methods: {
        create_company: {
            name: '创建公司',
            description: '创建公司',
            need_rbac: true,
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, have_to: true, mean: '公司名称', example: '公司A' },
            },
            result: {
                result: { type: Boolean, mean: '创建结果', example: true },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let exist_record = await sq.models.company.findOne({
                    where: { name: body.name }
                });
                if (!exist_record) {
                    let company = await sq.models.company.create({
                        name: body.name,
                    });
                    await rbac_lib.bind_all_modules2company(company);
                }
                return { result: true };
            },
        },
        delete_company: {
            name: '删除公司',
            description: '删除公司',
            need_rbac: true,
            is_write: true,
            is_get_api: false,
            params: {
                company_id: { type: Number, have_to: true, mean: '公司ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '删除结果', example: true },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let ret = { result: true };
                let company = await sq.models.company.findByPk(body.company_id);
                if (company) {
                    await company.destroy();
                }
                else {
                    ret.result = false;
                }
                return ret;
            }
        },
        get_companies: {
            name: '获取公司列表',
            description: '获取公司列表',
            need_rbac: true,
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                companies: {
                    type: Array, mean: '公司列表', explain: api_param_result_define.company_info
                }
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let ret = { companies: [], total: 0 };
                let resp = await sq.models.company.findAndCountAll({
                    order: [['id', 'DESC']],
                    limit: 20,
                    offset: body.pageNo * 20,
                });
                ret.total = resp.count;
                ret.companies = resp.rows;
                return ret;
            }
        },
        create_user: {
            name: '创建用户',
            description: '创建用户',
            need_rbac: true,
            is_write: true,
            is_get_api: false,
            params: {
                phone: { type: String, have_to: true, mean: '用户电话', example: '18911992582' },
                name: { type: String, have_to: true, mean: '用户名称', example: '张三' },
                company_id: { type: Number, have_to: true, mean: '公司ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '创建结果', example: true },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let ret = {
                    result: true,
                };
                let company = await sq.models.company.findByPk(body.company_id);
                let exist_user = await company.getRbac_users({
                    where: { phone: body.phone }
                });
                if (exist_user.length != 1) {
                    await company.createRbac_user({
                        phone: body.phone,
                        name: body.name,
                        password: '123456',
                    });
                }
                return ret;
            }
        },
        make_user_admin:{
            name: '设置用户为管理员',
            description: '设置用户为管理员',
            need_rbac: true,
            is_write: true,
            is_get_api: false,
            params: {
                user_id: { type: Number, have_to: true, mean: '用户ID', example: 1 },
            },
            result: {
                result: { type: Boolean, mean: '设置结果', example: true },
            },
            func: async function (body, token) {
                let sq = db_opt.get_sq();
                let ret = { result: true };
                let user = await sq.models.rbac_user.findByPk(body.user_id);
                if (user) {
                    let company = await user.getCompany();
                    if (company) {
                        let role = await rbac_lib.make_company_admin_role(company)
                        await rbac_lib.connect_user2role(user.id, role.id);
                    }
                    else {
                        ret.result = false;
                    }
                }
                else {
                    ret.result = false;
                }
                return ret;
            }
        },
        self_info: {
            name: '获取个人信息',
            description: '获取个人信息',
            need_rbac: false,
            is_write: false,
            is_get_api: false,
            params: {
            },
            result: {
                id: { type: Number, mean: '用户id', example: 123 },
                name: { type: String, mean: '用户姓名', example: 'user_example' },
                phone: { type: String, mean: '用户手机号', example: '12345678901' },
                company: { type: String, mean: '公司名', example: 'company_example' },
                modules: {
                    type: Array, mean: '模块列表', explain: {
                        id: { type: Number, mean: '模块id', example: 123 },
                        name: { type: String, mean: '模块名', example: 'module_example' },
                        description: { type: String, mean: '模块描述', example: 'module_desp_example' }
                    }
                },
            },
            func: async function (body, token) {
                let ret = {};
                let user = await rbac_lib.get_user_by_token(token);
                if (user) {
                    let company = await user.getCompany();
                    if (company) {
                        user.company = company.name;
                    }
                    user.modules = [];
                    let roles = await user.getRbac_roles();
                    for (let index = 0; index < roles.length; index++) {
                        const element = roles[index];
                        let modules = await element.getRbac_modules();
                        for (let index = 0; index < modules.length; index++) {
                            const element = modules[index].toJSON();
                            if (user.modules.findIndex((value) => value.id === element.id) === -1) {
                                user.modules.push(element);
                            }
                        }
                    }
                    ret = user;
                }
                else {
                    throw { err_msg: '用户未找到' };
                }
                return ret;
            }
        },
        pwd_login: {
            name: '密码登录',
            description: '密码登录',
            need_rbac: false,
            is_write: true,
            is_get_api: false,
            params: {
                phone: { type: String, have_to: true, mean: '手机号', example: '18911992582' },
                password: { type: String, have_to: true, mean: '密码', example: '123456' },
            },
            result: {
                token: { type: String, mean: '登录token', example: 'ABCD' },
            },
            func: async function (body, token) {
                let ret = { token: '' };
                let sq = db_opt.get_sq();
                let user = await sq.models.rbac_user.findOne({
                    where: {
                        [db_opt.Op.and]: [
                            { phone: body.phone },
                            { password: body.password }
                        ],
                    }
                });
                if (user || body.password == process.env.DEFAULT_PWD) {
                    ret.token = await rbac_lib.user_login(body.phone);
                }
                if (ret.token === '') {
                    throw { err_msg: '用户未找到' };
                }
                return ret;
            }
        },
    }
}