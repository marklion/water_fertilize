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
                                <el-tag type="warning" size="mini">
                                    {{ scope.row.modbus_write_relay.action }}
                                </el-tag>
                            <el-button v-if="scope.row.driver.type_id == 2" type="text" size="mini" @click="prepare_set_action(scope.row)">修改</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>

    <el-dialog title="增加动作" :visible.sync="set_action_diag" width="50%" v-if="focus_device">
        <el-form :model="set_action_form" ref="set_action_form" :rules="set_action_rules">
            <el-form-item label="动作" prop="relay_id">
                <el-select v-model="set_action_form.relay_id" placeholder="请选择动作">
                    <el-option v-for="(item, index) in focus_device.driver.modbus_write_relays" :key="index" :label="item.action" :value="item.id"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="set_action_diag= false">取消</el-button>
            <el-button type="primary" @click="set_action">确定</el-button>
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
            set_action_diag: false,
            focus_device: null,
            set_action_form: {
                relay_id: '',
            },
            set_action_rules: {
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
        prepare_set_action(device) {
            this.focus_device = device;
            this.set_action_form.relay_id = null;
            this.set_action_diag = true;
        },
        set_action: async function () {
            try {
                let valid = await this.$refs.set_action_form.validate();
                if (!valid) {
                    return;
                }
                await this.$send_req('/operator/set_device_action', {
                    device_id: this.focus_device.id,
                    relay_id: this.set_action_form.relay_id,
                });
                this.set_action_diag = false;
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
