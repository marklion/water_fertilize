<template>
<div class="policy_instance_show">
    <page-content ref="all_pis" body_key="policy_instances" enable req_url="/policy/get_policy_instances">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="名称" />
                    <el-table-column prop="status" label="状态" />
                    <el-table-column label="数据实例">
                        <template slot-scope="scope">
                            <el-descriptions :column="1" size="mini" border>
                                <el-descriptions-item v-for="single_data in scope.row.policy_template.policy_data_sources" :key="single_data.id" :label="single_data.name">
                                    <div v-if="find_instance_data(scope.row, single_data)">
                                        {{ find_instance_data(scope.row, single_data).device.name }}
                                        <el-button type="text" size="mini" @click="unbind_data(find_instance_data(scope.row, single_data))">解绑</el-button>
                                    </div>
                                    <el-button v-else type="text" size="mini" @click="prepare_bind_data(scope.row, single_data)">绑定</el-button>
                                </el-descriptions-item>
                            </el-descriptions>
                        </template>
                    </el-table-column>
                    <el-table-column label="动作实例">
                        <template slot-scope="scope">
                            <el-descriptions :column="1" size="mini" border>
                                <el-descriptions-item v-for="single_action in scope.row.policy_template.policy_action_nodes" :key="single_action.id" :label="single_action.name">
                                    <div v-if="find_instance_action(scope.row, single_action)">
                                        {{ find_instance_action(scope.row, single_action).device.name }}
                                        <el-button type="text" size="mini" @click="unbind_action(find_instance_action(scope.row, single_action))">解绑</el-button>
                                    </div>
                                    <el-button v-else type="text" size="mini" @click="prepare_bind_action(scope.row, single_action)">绑定</el-button>
                                </el-descriptions-item>
                            </el-descriptions>
                        </template>
                    </el-table-column>
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="prepare_add_pi">新增</el-button>
                        </template>
                        <template slot-scope="scope">
                            <el-button size="mini" type="warning" @click="update_pi(scope.row)">编辑</el-button>
                            <el-button size="mini" type="danger" @click="del_pi(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
    <el-dialog :title="isEditPI ? '编辑策略实例' : '新增策略实例'" :visible.sync="add_pi_diag" width="50%">
        <el-form :model="pi_form" ref="pi_form" :rules="pi_form_rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="pi_form.name"></el-input>
            </el-form-item>
            <el-form-item label="策略模板" prop="pt_id">
                <select-search v-model="pi_form.pt_id" :permission_array="['policy']" body_key="policy_templates" get_url="/policy/get_policy_templates" item_label="name" item_value="id"></select-search>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_pi_diag= false">取消</el-button>
            <el-button type="primary" @click="add_pi">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog title="绑定数据" :visible.sync="bind_data_diag" width="50%">
        <el-form :model="data_form" ref="data_form" :rules="data_form_rules">
            <el-form-item label="设备" prop="device_id">
                <select-search v-model="data_form.device_id" :permission_array="['resource_management']" body_key="devices" get_url="/resource_management/get_devices" item_label="name" item_value="id"></select-search>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="bind_data_diag = false">取消</el-button>
            <el-button type="primary" @click="bind_data">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog title="绑定动作" :visible.sync="bind_action_diag" width="50%">
        <el-form :model="action_form" ref="action_form" :rules="action_form_rules">
            <el-form-item label="设备" prop="device_id">
                <select-search v-model="action_form.device_id" :permission_array="['resource_management']" body_key="devices" get_url="/resource_management/get_devices" item_label="name" item_value="id"></select-search>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="bind_action_diag = false">取消</el-button>
            <el-button type="primary" @click="bind_action">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
import SelectSearch from '../../components/SelectSearch.vue';
export default {
    name: 'PolicyInstance',
    components: {
        "page-content": PageContent,
        "select-search": SelectSearch,
    },
    data: function () {
        return {
            add_pi_diag: false,
            isEditPI: false,
            editingPIId: null,
            pi_form: {
                name: '',
                pt_id: null,
            },
            pi_form_rules: {
                name: [
                    { required: true, message: '策略实例名称不能为空', trigger: 'blur' },
                ],
                pt_id: [
                    { required: true, message: '请选择策略模板', trigger: 'change' },
                ],
            },
            bind_data_diag: false,
            data_form: {
                pi_id: 0,
                ds_id: 0,
                device_id: 0,
            },
            data_form_rules: {
                pi_id: [
                    { required: true, message: '策略实例不能为空', trigger: 'change' },
                ],
                ds_id: [
                    { required: true, message: '数据源不能为空', trigger: 'change' },
                ],
                device_id: [
                    { required: true, message: '设备不能为空', trigger: 'change' },
                ],
            },
            bind_action_diag: false,
            action_form: {
                pi_id: 0,
                an_id: 0,
                device_id: 0,
            },
            action_form_rules: {
                pi_id: [
                    { required: true, message: '策略实例不能为空', trigger: 'change' },
                ],
                an_id: [
                    { required: true, message: '动作不能为空', trigger: 'change' },
                ],
                device_id: [
                    { required: true, message: '设备不能为空', trigger: 'change' },
                ],
            },
        };
    },
    methods: {
        prepare_bind_action: function (pi, an) {
            this.bind_action_diag = true;
            this.action_form.pi_id = pi.id;
            this.action_form.an_id = an.id;
            this.action_form.device_id = null;
        },
        bind_action: async function () {
            let valid = await this.$refs.action_form.validate();
            if (!valid) {
                return;
            }
            await this.$send_req('/policy/bind_device_action_node', {
                pi_id: this.action_form.pi_id,
                an_id: this.action_form.an_id,
                device_id: this.action_form.device_id,
            });
            this.prepare_bind_action(0, 0);
            this.bind_action_diag = false;
            this.refresh();
        },
        unbind_action: async function (pia) {
            await this.$confirm('是否解绑动作 ' + pia.policy_action_node.name + ' ?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/unbind_device_action_node', {
                pia_id: pia.id,
            });
            this.refresh();
        },
        prepare_bind_data: function (pi, ds) {
            this.bind_data_diag = true;
            this.data_form.pi_id = pi.id;
            this.data_form.ds_id = ds.id;
            this.data_form.device_id = null;
        },
        bind_data: async function () {
            let valid = await this.$refs.data_form.validate();
            if (!valid) {
                return;
            }
            await this.$send_req('/policy/bind_device_data_source', {
                pi_id: this.data_form.pi_id,
                ds_id: this.data_form.ds_id,
                device_id: this.data_form.device_id,
            });
            this.prepare_bind_data(0, 0);
            this.bind_data_diag = false;
            this.refresh();
        },
        unbind_data: async function (pid) {
            await this.$confirm('是否解绑数据 ' + pid.policy_data_source.name + ' ?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/unbind_device_data_source', {
                pid_id: pid.id,
            });
            this.refresh();
        },
        find_instance_data: function (pi, ds) {
            let ret = undefined;
            for (let index = 0; index < pi.policy_instance_data.length; index++) {
                const element = pi.policy_instance_data[index];
                if (element.policy_data_source.id == ds.id) {
                    ret = element;
                    break;
                }
            }
            return ret;
        },
        find_instance_action: function (pi, an) {
            let ret = undefined;
            for (let index = 0; index < pi.policy_instance_actions.length; index++) {
                const element = pi.policy_instance_actions[index];
                if (element.policy_action_node.id == an.id) {
                    ret = element;
                    break;
                }
            }
            return ret;
        },
        prepare_add_pi: function () {
            this.add_pi_diag = true;
            this.isEditPI = false;
            this.editingPIId = null;
            this.pi_form.name = '';
            this.pi_form.pt_id = null;
        },
        refresh: function () {
            this.$refs.all_pis.refresh();
        },
        update_pi: function (pi) {
            this.isEditPI = true;
            this.editingPIId = pi.id;
            let pt_id = null;
            if (pi.pt_id !== undefined && pi.pt_id !== null) {
                pt_id = Number(pi.pt_id);
            } else if (pi.policy_template && pi.policy_template.id) {
                pt_id = Number(pi.policy_template.id);
            } else if (pi.policyTemplateId) {
                pt_id = Number(pi.policyTemplateId);
            }
            this.pi_form = {
                name: pi.name,
                pt_id: pt_id,
            };
            this.add_pi_diag = true;
        },
        async add_pi() {
            let valid = await this.$refs.pi_form.validate();
            if (!valid) {
                return;
            }
            if (!this.pi_form.pt_id) {
                this.$message.error('请选择策略模板');
                return;
            }
            const payload = {
                name: this.pi_form.name,
                pt_id: Number(this.pi_form.pt_id),
            };
            if (this.isEditPI && this.editingPIId) {
                await this.$send_req('/policy/update_policy_instance', {
                    pi_id: this.editingPIId,
                    ...payload
                });
            } else {
                await this.$send_req('/policy/add_policy_instance', payload);
            }
            this.refresh();
            this.prepare_add_pi();
            this.add_pi_diag = false;
        },
        del_pi: async function (pi) {
            await this.$confirm('是否删除策略实例 ' + pi.name + ' ?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
            });
            await this.$send_req('/policy/del_policy_instance', {
                pi_id: pi.id,
            });
            this.refresh();
        },
    },
}
</script>

<style>

</style>
