<template>
<div class="user_config_show">
    <page-content ref="all_users" body_key="users" enable req_url="/global/get_users">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="用户名" />
                    <el-table-column prop="phone" label="电话" />
                    <el-table-column prop="company.name" label="公司" />
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="add_user_diag = true">新增</el-button>
                        </template>
                        <template slot-scope="scope">
                            <el-button size="mini" type="danger" @click="delete_user(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
    <el-dialog title="新增用户" :visible.sync="add_user_diag" width="50%">
        <el-form :model="user_form" ref="user_form" :rules="add_user_rules">
            <select-search body_key="companies" get_url="/global/get_companies" item_label="name" item_value="id" v-model="selected_company_id" :permission_array="['global']"></select-search>
            <el-form-item label="用户名" prop="name">
                <el-input v-model="user_form.name"></el-input>
            </el-form-item>
            <el-form-item label="电话" prop="phone">
                <el-input v-model="user_form.phone"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_user_diag = false">取消</el-button>
            <el-button type="primary" @click="add_user">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
import SelectSearch from '../../components/SelectSearch.vue';
export default {
    name: 'UserConfig',
    components: {
        "page-content": PageContent,
        "select-search": SelectSearch
    },
    data: function () {
        return {
            add_user_diag: false,
            user_form: {
                name: '',
                phone: '',
            },
            selected_company_id: 0,
            add_user_rules: {
                name: [
                    { required: true, message: '请输入用户名', trigger: 'blur' },
                    { min: 2, max: 20, message: '用户名长度在2到20个字符之间', trigger: 'blur' }
                ],
                phone: [
                    { required: true, message: '请输入电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
                ]
            }
        };
    },
    methods: {
        refresh: function () {
            this.$refs.all_users.refresh();
        },
        add_user: async function () {
            try {
                let valid = await this.$refs.user_form.validate();
                if (!valid) {
                    return;
                }
                await this.$send_req('/global/create_user', {
                    name: this.user_form.name,
                    phone: this.user_form.phone,
                    company_id: this.selected_company_id
                });
                await this.$send_req
                this.refresh();
                this.add_user_diag = false;
            } catch (error) {
                console.log(error);
            }
        },
        delete_user: async function (user) {
            try {
                await this.$confirm(`确定删除用户 ${user.name} 吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await this.$send_req('/global/delete_user', {
                    user_id: user.id
                });
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
    },
}
</script>

<style>

</style>
