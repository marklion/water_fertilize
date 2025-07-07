<template>
<div class="device_config_show">
    <page-content ref="all_device" body_key="devices" enable req_url="/resource_management/get_devices">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="名称" />
                    <el-table-column prop="driver.name" label="驱动" />
                    <el-table-column prop="connection_key" label="连接key" />
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="add_device_diag = true">新增</el-button>
                        </template>
                        <template slot-scope="scope">
                            <el-button size="mini" type="danger" @click="delete_device(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
    <el-dialog title="新增设备" :visible.sync="add_device_diag" width="50%">
        <el-form :model="device_form" ref="device_form" :rules="add_device_rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="device_form.name"></el-input>
            </el-form-item>
            <el-form-item label="驱动" prop="driver_id">
                <select-search body_key="drivers" get_url="/resource_management/get_drivers" item_label="name" item_value="id" v-model="device_form.driver_id" :permission_array="['resource_management']"></select-search>
            </el-form-item>
            <el-form-item label="连接方式" prop="connection_key.type">
                <el-select v-model="device_form.connection_key.type" clearable placeholder="请选择">
                    <el-option value="ip_lora" label="IP LoRa" />
                </el-select>
            </el-form-item>
            <el-form-item label="主机名" prop="connection_key.ip">
                <el-input v-model="device_form.connection_key.ip"></el-input>
            </el-form-item>
            <el-form-item label="主机端口" prop="connection_key.port">
                <el-input v-model.number="device_form.connection_key.port"></el-input>
            </el-form-item>
            <el-form-item label="从站地址" prop="connection_key.prefix">
                <el-input v-model="device_form.connection_key.prefix"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_driver_diag = false">取消</el-button>
            <el-button type="primary" @click="add_driver">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
import SelectSearch from '../../components/SelectSearch.vue';
export default {
    name: 'device_config',
    components: {
        "page-content": PageContent,
        "select-search": SelectSearch
    },
    data: function () {
        return {
            add_device_diag: false,
            device_form: {
                name: '',
                driver_id: 0,
                connection_key:{
                    type: 'ip_lora',
                    ip: '',
                    port: '',
                    prefix: ''
                }
            },
            add_device_rules: {
                name: [
                    { required: true, message: '请输入设备名称', trigger: 'blur' },
                    { min: 2, max: 20, message: '设备名称长度在2到20个字符之间', trigger: 'blur' }
                ],
                driver_id: [
                    { required: true, message: '请选择驱动', trigger: 'change' }
                ],
                'connection_key.ip': [
                    { required: true, message: 'IP 或域名不能为空', trigger: 'blur' },
                    { 
                        validator: (rule, value, callback) => {
                            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
                            if (!ipRegex.test(value)) {
                                callback(new Error('请输入合法的 IP 地址或域名'));
                            } else {
                                callback();
                            }
                        }, trigger: 'blur'
                    }
                ],
                'connection_key.port': [
                    { required: true, message: '端口不能为空', trigger: 'blur' },
                    {
                        validator: (rule, value, callback) => {
                            const portRegex = /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-5]{2}[0-3][0-5])$/;
                            if (!portRegex.test(value)) {
                                callback(new Error('请输入合法的端口号（1-65535）'));
                            } else {
                                callback();
                            }
                        }, trigger: 'blur'
                    }
                ],
                'connection_key.prefix': [
                    { required: true, message: '从站地址不能为空', trigger: 'blur' },
                    {
                        validator: (rule, value, callback) => {
                            if (value.length !== 8) {
                                callback(new Error('从站地址必须为 8 位字符'));
                            } else {
                                callback();
                            }   
                        }, trigger: 'blur'
                    }
                ]
            },
        };
    },
    methods: {
        refresh: function () {
            this.$refs.all_device.refresh();
        },
        add_driver: async function () {
            try {
                let valid = await this.$refs.device_form.validate();
                if (!valid) {
                    return;
                }
                const payload = {
                    ...this.device_form,
                    connection_key: JSON.stringify(this.device_form.connection_key)
                };
                await this.$send_req('/resource_management/add_device', payload);
                this.add_device_diag = false;
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        delete_device: async function (device) {
            try {
                await this.$confirm('确定删除设备 ' + device.name + ' 吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await this.$send_req('/resource_management/del_device', { device_id: device.id });
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
