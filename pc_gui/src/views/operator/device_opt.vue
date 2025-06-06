<template>
<div class="device_opt_show">
    <page-content ref="devices" enable body_key="devices" req_url="/operator/get_devices">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="名称" />
                    <el-table-column label="数据">
                        <template slot-scope="scope">
                            <span v-for="single_data in scope.row.device_data" :key="single_data.id">
                                <el-tag size="mini" type="primary">
                                    {{ single_data.modbus_read_metum.title }}: {{ single_data.value }}
                                </el-tag>
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="动作">
                        <template slot-scope="scope">
                            <span v-for="single_action in  scope.row.device_actions" :key="single_action.id">
                                <el-tag type="warning" size="mini" closable @close="del_action(single_action)">
                                    {{ single_action.modbus_write_relay.action }}
                                </el-tag>
                            </span>
                            <el-tag v-if="scope.row.driver.type_id == 2" type="success" size="mini" @click="prepare_add_action(scope.row)">+</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>

    <el-dialog title="增加动作" :visible.sync="add_action_diag" width="50%" v-if="focus_device">
        <el-form :model="add_action_form" ref="add_action_form" :rules="add_action_rules">
            <el-form-item label="动作" prop="relay_id">
                <el-select v-model="add_action_form.relay_id" placeholder="请选择动作">
                    <el-option v-for="(item, index) in focus_device.driver.modbus_write_relays" :key="index" :label="item.action" :value="item.id"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_action_diag= false">取消</el-button>
            <el-button type="primary" @click="add_action">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
export default {
    name: 'device_opt_show',
    components: {
        "page-content": PageContent,
    },
    data: function () {
        return {
            add_action_diag: false,
            focus_device: null,
            add_action_form: {
                relay_id: '',
            },
            add_action_rules: {
                relay_id: [
                    { required: true, message: '请选择动作', trigger: 'change' },
                ],
            },
        };
    },
    methods: {
        refresh: function () {
            this.$refs.devices.refresh();
        },
        prepare_add_action(device) {
            this.focus_device = device;
            this.add_action_form.relay_id = null;
            this.add_action_diag = true;
        },
        add_action: async function () {
            try {
                let valid = await this.$refs.add_action_form.validate();
                if (!valid) {
                    return;
                }
                await this.$send_req('/operator/add_device_action', {
                    device_id: this.focus_device.id,
                    relay_id: this.add_action_form.relay_id,
                });
                this.add_action_diag = false;
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        del_action: async function (action) {
            try {
                await this.$confirm('确定删除该动作吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                await this.$send_req('/operator/del_device_action', {
                    action_id: action.id,
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
