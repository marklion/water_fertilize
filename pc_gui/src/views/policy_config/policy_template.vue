<template>
<div class="policy_template_show">
    <page-content ref="all_pts" body_key="policy_templates" enable req_url="/policy/get_policy_templates">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="名称" />
                    <el-table-column label="数据源">
                        <template slot-scope="scope">
                            <span v-for="single_ds in  scope.row.policy_data_sources" :key="single_ds.id">
                                <el-tag type="warning" size="mini" :closable="$should_edit(scope.row)" @close="del_data_source(single_ds)">
                                    {{ single_ds.name}}-{{ single_ds.modbus_read_metum.title }}
                                </el-tag>
                            </span>
                            <el-tag v-if="$should_edit(scope.row)" type="success" size="mini" @click="prepare_add_data_source(scope.row.id)">+</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="动作集">
                        <template slot-scope="scope">
                            <span v-for="single_an in  scope.row.policy_action_nodes" :key="single_an.id">
                                <el-tag type="warning" size="mini" :closable="$should_edit(scope.row)" @close="del_action_node(single_an)">
                                    {{ single_an.name}}-{{ single_an.modbus_write_relay.action}}
                                </el-tag>
                            </span>
                            <el-tag v-if="$should_edit(scope.row)" type="success" size="mini" @click="prepare_add_action_node(scope.row.id)">+</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="变量">
                        <template slot-scope="scope">
                            <span v-for="single_var in  scope.row.policy_variables" :key="single_var.id">
                                <el-tag type="warning" size="mini" :closable="$should_edit(scope.row)" @close="del_variable(single_var)">
                                    {{ single_var.name}}
                                </el-tag>
                            </span>
                            <el-tag v-if="$should_edit(scope.row)" type="success" size="mini" @click="add_variable(scope.row.id)">+</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="add_pt">新增</el-button>
                        </template>
                        <template slot-scope="scope">
                            <el-button size="mini" type="warning" @click="update_pt(scope)">编辑</el-button>
                            <el-button v-if="$should_edit(scope.row)" size="mini" type="danger" @click="del_pt(scope)">删除</el-button>
                            <el-button size="mini" type="primary" @click="open_state_page(scope.row)">展开状态</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
    <el-drawer destroy-on-close :visible.sync="policy_state_draw" direction="rtl" size="70%">
        <template slot="title">
            <span>状态详情</span>
            <el-button v-if="$should_edit(focus_policy)" type="primary" size="small" @click="add_state">新增状态</el-button>
        </template>
        <policy-state
            :editable="$should_edit(focus_policy)"
            :action_nodes="focus_policy.policy_action_nodes || []"
            :policy_state_nodes="focus_policy.policy_state_nodes || []"
            :pt_id="focus_policy.id"
            :template_variable_id="(focus_policy.policy_variables && focus_policy.policy_variables.length > 0) ? focus_policy.policy_variables[0].id : null"
            :policyVariables="focus_policy.policy_variables || []"
            :dataSources="focus_policy.policy_data_sources || []"
            @refresh="refresh"
        ></policy-state>
    </el-drawer>
    <el-dialog title="新增数据源" :visible.sync="add_ds_diag" width="50%">
        <el-form :model="ds_form" ref="ds_form" :rules="ds_form_rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="ds_form.name"></el-input>
            </el-form-item>
            <el-form-item label="数据来源" prop="modbus_read_meta_id">
                <select-search v-model="ds_form.modbus_read_meta_id" :permission_array="['policy']" body_key="modbus_read_meta" get_url="/policy/get_all_modbus_read_meta" item_label="whole_name" item_value="id"></select-search>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_ds_diag = false">取消</el-button>
            <el-button type="primary" @click="add_data_source">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog title="新增动作" :visible.sync="add_an_diag" width="50%">
        <el-form :model="an_form" ref="an_form" :rules="an_form_rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="an_form.name"></el-input>
            </el-form-item>
            <el-form-item label="动作" prop="modbus_write_relay_id">
                <select-search v-model="an_form.modbus_write_relay_id" :permission_array="['policy']" body_key="modbus_write_relays" get_url="/policy/get_all_modbus_write_relays" item_label="whole_name" item_value="id"></select-search>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_an_diag = false">取消</el-button>
            <el-button type="primary" @click="add_action_node">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
import SelectSearch from '../../components/SelectSearch.vue';
import PolicyState from './policy_state.vue';
export default {
    name: 'PolicyTemplate',
    components: {
        "page-content": PageContent,
        "select-search": SelectSearch,
        "policy-state": PolicyState,
    },
    data: function () {
        return {
            ds_form: {
                pt_id: 0,
                modbus_read_meta_id: null,
                name: '',
            },
            ds_form_rules: {
                name: [
                    { required: true, message: '请输入数据源名称', trigger: 'blur' },
                ],
                modbus_read_meta_id: [
                    { required: true, message: '请选择数据来源', trigger: 'change' },
                ],
            },
            add_ds_diag: false,
            an_form: {
                pt_id: 0,
                modbus_write_relay_id: null,
                name: '',
            },
            an_form_rules: {
                name: [
                    { required: true, message: '请输入动作名称', trigger: 'blur' },
                ],
                modbus_write_relay_id: [
                    { required: true, message: '请选择动作', trigger: 'change' },
                ],
            },
            add_an_diag: false,
            policy_state_draw: false,
            focus_policy: {}
        };
    },
    methods: {
        del_variable: async function (single_var) {
            let name = single_var.name;
            await this.$confirm(`是否删除变量 ${name}？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/del_policy_variable', {
                pv_id: single_var.id,
            });
            this.refresh();
        },
        add_variable: async function (pt_id) {
            let name = await this.$prompt('请输入变量名称', '新增变量', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            if (name.value === '') {
                this.$message.error('变量名称不能为空');
                return;
            }
            await this.$send_req('/policy/add_policy_variable', {
                pt_id: pt_id,
                name: name.value,
            });
            this.refresh();
        },
        add_state: async function () {
            let name = await this.$prompt('请输入状态名称', '新增状态', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            if (name.value === '') {
                this.$message.error('状态名称不能为空');
                return;
            }
            await this.$send_req('/policy/add_state_node', {
                pt_id: this.focus_policy.id,
                name: name.value,
            });
            this.refresh();
        },
        open_state_page: function (focus_policy) {
            this.focus_policy = focus_policy;
            this.policy_state_draw = true;
        },
        prepare_add_action_node: function (pt_id) {
            this.an_form.pt_id = pt_id;
            this.an_form.modbus_write_relay_id = null;
            this.an_form.name = '';
            this.add_an_diag = true;
        },
        prepare_add_data_source: function (pt_id) {
            this.ds_form.pt_id = pt_id;
            this.ds_form.modbus_read_meta_id = null;
            this.ds_form.name = '';
            this.add_ds_diag = true;
        },
        del_data_source: async function (single_ds) {
            let name = single_ds.name;
            await this.$confirm(`是否删除数据源 ${name}？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/del_data_source', {
                ds_id: single_ds.id,
            });
            this.refresh();
        },
        del_action_node: async function (single_action) {
            let name = single_action.name;
            await this.$confirm(`是否删除动作 ${name}？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/del_action_node', {
                an_id: single_action.id,
            });
            this.refresh();
        },
        add_action_node: async function () {
            let valid = await this.$refs.an_form.validate();
            if (!valid) {
                return;
            }
            await this.$send_req('/policy/add_action_node', {
                pt_id: this.an_form.pt_id,
                modbus_write_relay_id: parseInt(this.an_form.modbus_write_relay_id),
                name: this.an_form.name,
            });
            this.prepare_add_action_node(0);
            this.add_an_diag = false;
            this.refresh();
        },
        add_data_source: async function () {
            let valid = await this.$refs.ds_form.validate();
            if (!valid) {
                return;
            }
            await this.$send_req('/policy/add_data_source', {
                pt_id: this.ds_form.pt_id,
                modbus_read_meta_id: parseInt(this.ds_form.modbus_read_meta_id),
                name: this.ds_form.name,
            });
            this.prepare_add_data_source(0);
            this.add_ds_diag = false;
            this.refresh();
        },
        refresh: function () {
            this.$refs.all_pts.refresh();
            this.focus_policy = {};
            this.policy_state_draw = false;
        },
        add_pt: async function () {
            let name = await this.$prompt('请输入策略模板名称', '新增策略模板', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            let pt_name = name.value;
            if (this.$hasPermission('global')) {
                pt_name = '预配置-' + pt_name;
            }
            await this.$send_req('/policy/add_policy_template', {
                name: pt_name,
            });
            this.refresh();
        },
        update_pt: async function (scope) { 
            try {
                let result = await this.$prompt('请输入新的策略模板名称', '编辑策略模板', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputValue: scope.row.name,
                    inputPattern: /^.{2,50}$/,
                    inputErrorMessage: '名称长度在2到50个字符之间'
                });
                console.log(scope.row);
                await this.$send_req('/policy/update_policy_template', {
                    pt_id: scope.row.id,
                    name: result.value
                });
                this.refresh();
            } catch (error) {
                // 用户取消或出错
            }
        },
        del_pt: async function (scope) {
            let name = scope.row.name;
            await this.$confirm(`是否删除策略模板 ${name}？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/del_policy_template', {
                pt_id: scope.row.id,
            });
            this.refresh();
        },
    },
}
</script>

<style>

</style>
