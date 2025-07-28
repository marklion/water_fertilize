<template>
<div class="driver_config_show">
    <page-content ref="all_driver" body_key="drivers" enable req_url="/resource_management/get_drivers">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="名称" />
                    <el-table-column label="类型">
                        <template slot-scope="scope">
                            {{ driver_id2name(scope.row.type_id) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="数据" width="840px">
                        <template slot-scope="scope">
                            <div v-if="scope.row.type_id == 1">
                                <el-table :data="scope.row.modbus_read_meta" style="width: 100%">
                                    <el-table-column prop="title" label="标题" />
                                    <el-table-column prop="reg_address" label="寄存器地址" />
                                    <el-table-column prop="data_type" label="数据类型" />
                                    <el-table-column v-if="$should_edit(scope.row)">
                                        <template slot="header">
                                            <el-button size="mini" type="success" @click="prepare_add_meta(scope.row)">新增</el-button>
                                        </template>
                                        <template slot-scope="sub_scope">
                                            <el-button size="mini" type="warning" @click="update_meta(sub_scope.row, scope.row)">编辑</el-button>
                                            <el-button size="mini" type="danger" @click="delete_meta(sub_scope.row)">删除</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </div>
                            <div v-if="scope.row.type_id == 2">
                                <el-table :data="scope.row.modbus_write_relays" style="width: 100%">
                                    <el-table-column prop="action" label="动作" />
                                    <el-table-column prop="reg_address" label="寄存器地址" />
                                    <el-table-column prop="value" label="指令值" />
                                    <el-table-column v-if="$should_edit(scope.row)">
                                        <template slot="header">
                                            <el-button size="mini" type="success" @click="prepare_add_relay(scope.row)">新增</el-button>
                                        </template>
                                        <template slot-scope="sub_scope">
                                            <el-button size="mini" type="warning" @click="update_relay(sub_scope.row, scope.row)">编辑</el-button>
                                            <el-button size="mini" type="danger" @click="delete_relay(sub_scope.row)">删除</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="prepare_add_driver">新增</el-button>
                        </template>
                        <template slot-scope="scope" v-if="$should_edit(scope.row)">
                            <el-button size="mini" type="warning" @click="update_driver(scope.row)">编辑</el-button>
                            <el-button size="mini" type="danger" @click="delete_driver(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
    <el-dialog :title="isEditDriver ? '编辑驱动' : '新增驱动'" :visible.sync="add_driver_diag" width="50%">
        <el-form :model="driver_form" ref="driver_form" :rules="add_driver_rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="driver_form.name"></el-input>
            </el-form-item>
            <el-form-item label="类型" prop="type_id">
                <el-select v-model="driver_form.type_id" placeholder="请选择驱动类型">
                    <el-option v-for="(item, index) in driver_type" :key="index" :label="item.name" :value="item.type_id"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_driver_diag = false">取消</el-button>
            <el-button type="primary" @click="add_driver">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog :title="isEditMeta ? '编辑数据':'新增数据'" :visible.sync="add_meta_diag" width="50%">
        <el-form :model="meta_form" ref="meta_form" :rules="add_meta_rules">
            <el-form-item label="标题" prop="title">
                <el-input v-model="meta_form.title"></el-input>
            </el-form-item>
            <el-form-item label="地址" prop="reg_address">
                <el-input v-model="meta_form.reg_address"></el-input>
            </el-form-item>
            <el-form-item label="类型" prop="data_type">
                <el-select v-model="meta_form.data_type" placeholder="请选择数据类型">
                    <el-option v-for="(item, index) in data_type" :key="index" :label="item.name" :value="item.data_type"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_meta_diag = false">取消</el-button>
            <el-button type="primary" @click="add_meta">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog :title="isEditRelay ? '编辑继电器':'新增继电器'" :visible.sync="add_relay_diag" width="50%">
        <el-form :model="relay_form" ref="relay_form" :rules="add_relay_rules">
            <el-form-item label="动作" prop="action">
                <el-input v-model="relay_form.action"></el-input>
            </el-form-item>
            <el-form-item label="地址" prop="reg_address">
                <el-input v-model="relay_form.reg_address"></el-input>
            </el-form-item>
            <el-form-item label="指令值" prop="value">
                <el-input v-model="relay_form.value"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_relay_diag = false">取消</el-button>
            <el-button type="primary" @click="add_relay">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog :title="isEditDevice ? '编辑设备' : '新增设备'" :visible.sync="add_device_diag" width="50%">
        <el-form :model="device_form" ref="device_form" :rules="add_device_rules">
            <el-form-item label="名称" prop="name">
                <el-input v-model="device_form.name"></el-input>
            </el-form-item>
            <el-form-item label="驱动" prop="driver_id">
                <el-select v-model="device_form.driver_id" placeholder="请选择驱动">
                    <el-option v-for="(item, index) in driver_type" :key="index" :label="item.name" :value="item.type_id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="连接密钥" prop="connection_key">
                <el-input v-model="device_form.connection_key"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_device_diag = false">取消</el-button>
            <el-button type="primary" @click="add_device">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
export default {
    name: 'driver_config',
    components: {
        "page-content": PageContent,
    },
    data() {
        return {     
            isEditDriver: false,
            editingDriverId: null,
            isEditMeta: false,
            editingMetaId: null,
            isEditRelay: false,
            editingRelayId: null,
            isEditDevice: false,
            editingDeviceId: null,
            driver_type: {
                modbus_meter: {
                    type_id: 1,
                    name: 'Modbus 仪表(3)',
                },
                modbus_relay: {
                    type_id: 2,
                    name: 'Modbus 继电器(5)',
                },
            },
            data_type: [
                { data_type: 'uint32', name: '无符号32位整数' },
            ],
            add_driver_diag: false,
            add_driver_rules: {
                name: [
                    { required: true, message: '请输入驱动名称', trigger: 'blur' },
                    { min: 2, max: 20, message: '驱动名称长度在2到20个字符之间', trigger: 'blur' }
                ],
                type_id: [
                    { required: true, message: '请选择驱动类型', trigger: 'change' }
                ]
            },
            driver_form: {
                name: '',
                type_id: null,
            },
            add_meta_diag: false,
            add_meta_rules: {
                title: [
                    { required: true, message: '请输入标题', trigger: 'blur' },
                    { min: 2, max: 50, message: '标题长度在2到50个字符之间', trigger: 'blur' }
                ],
                reg_address: [
                    { required: true, message: '请输入寄存器地址', trigger: 'blur' },
                    { pattern: /^\d+$/, message: '寄存器地址必须为数字', trigger: 'blur' }
                ],
                data_type: [
                    { required: true, message: '请输入数据类型', trigger: 'blur' },
                ]
            },
            focus_driver: null,
            meta_form: {
                title: '',
                reg_address: '',
                data_type: '',
            },
            add_relay_diag: false,
            add_relay_rules: {
                action: [
                    { required: true, message: '请输入动作', trigger: 'blur' },
                ],
                reg_address: [
                    { required: true, message: '请输入寄存器地址', trigger: 'blur' },
                    { pattern: /^\d+$/, message: '寄存器地址必须为数字', trigger: 'blur' }
                ],
                value: [
                    { required: true, message: '请输入指令值', trigger: 'blur' },
                ]
            },
            relay_form: {
                action: '',
                reg_address: '',
                value: '',
            },
            add_device_diag: false,
            device_form: {
                name: '',
                driver_id: null,
                connection_key: '',
            },
            add_device_rules: {
                name: [
                    { required: true, message: '请输入设备名称', trigger: 'blur' },
                    { min: 2, max: 20, message: '设备名称长度在2到20个字符之间', trigger: 'blur' }
                ],
                driver_id: [
                    { required: true, message: '请选择驱动', trigger: 'change' }
                ],
                connection_key: [
                    { required: true, message: '请输入连接密钥', trigger: 'blur' },
                ]
            },
        };
    },
    methods: {
        prepare_add_relay: function (driver) {
            this.isEditRelay = false;
            this.editingRelayId = null;
            this.relay_form = {
                action: '',
                reg_address: '',
                value: '',
            };
            this.add_relay_diag = true;
            this.focus_driver = driver;
        },
        add_relay: async function () {
            try {
                let valid = await this.$refs.relay_form.validate();
                if (!valid) {
                    return;
                }
                if (this.isEditRelay && this.editingRelayId) {
                    // 编辑
                    await this.$send_req('/resource_management/update_driver_relay', {
                        relay_id: this.editingRelayId,
                        driver_id: this.focus_driver.id,
                        action: this.relay_form.action,
                        reg_address: parseInt(this.relay_form.reg_address),
                        value: this.relay_form.value,
                    });
                } else {
                    // 新增
                    await this.$send_req('/resource_management/add_driver_relay', {
                        driver_id: this.focus_driver.id,
                        action: this.relay_form.action,
                        reg_address: parseInt(this.relay_form.reg_address),
                        value: this.relay_form.value,
                    });
                }
                this.add_relay_diag = false;
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        delete_relay: async function (relay) {
            try {
                await this.$confirm(`确定删除继电器 ${relay.action} 吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await this.$send_req('/resource_management/del_driver_relay', {
                    relay_id: relay.id
                });
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        update_relay: function (relay, driver) {
            this.isEditRelay = true;
            this.editingRelayId = relay.id;
            this.relay_form = {
                action: relay.action,
                reg_address: relay.reg_address,
                value: relay.value,
            };
            this.focus_driver = driver;
            this.add_relay_diag = true;
        },
        prepare_add_meta: function (driver) {
            this.isEditMeta = false;
            this.editingMetaId = null;
            this.meta_form = {
                title: '',
                reg_address: '',
                data_type: '',
            };
            this.add_meta_diag = true;
            this.focus_driver = driver;
        },
        update_meta: function (meta, driver) {
            this.isEditMeta = true;
            this.editingMetaId = meta.id;
            this.meta_form = {
                title: meta.title,
                reg_address: meta.reg_address,
                data_type: meta.data_type,
            };
            this.focus_driver = driver;
            this.add_meta_diag = true;
        },
        refresh: function () {
            this.$refs.all_driver.refresh();
        },
        driver_id2name: function (type_id) {
            for (const key in this.driver_type) {
                if (this.driver_type[key].type_id === type_id) {
                    return this.driver_type[key].name;
                }
            }
            return '未知类型';
        },
        async add_meta() {
            try {
                let valid = await this.$refs.meta_form.validate();
                if (!valid) {
                    return;
                }
                if (this.isEditMeta && this.editingMetaId) {
                    // 编辑
                    await this.$send_req('/resource_management/update_driver_meta', {
                        meta_id: this.editingMetaId,
                        driver_id: this.focus_driver.id,
                        title: this.meta_form.title,
                        reg_address: parseInt(this.meta_form.reg_address),
                        data_type: this.meta_form.data_type,
                    });
                } else {
                    // 新增
                    await this.$send_req('/resource_management/add_driver_meta', {
                        driver_id: this.focus_driver.id,
                        title: this.meta_form.title,
                        reg_address: parseInt(this.meta_form.reg_address),
                        data_type: this.meta_form.data_type,
                    });
                }
                this.add_meta_diag = false;
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        delete_meta: async function (meta) {
            try {
                await this.$confirm(`确定删除数据 ${meta.title} 吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await this.$send_req('/resource_management/del_driver_meta', {
                    meta_id: meta.id
                });
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        async add_driver() {
            let valid = await this.$refs.driver_form.validate();
            if (!valid) return;
            let driver_name = this.driver_form.name.trim();
            if (this.$hasPermission('global')) {
            driver_name = '预配置-' + driver_name;
            }
            if (this.isEditDriver && this.editingDriverId) {
            // 编辑
            await this.$send_req('/resource_management/update_driver', {
                driver_id: this.editingDriverId,
                name: driver_name,
                type_id: parseInt(this.driver_form.type_id)
            });
            } else {
            // 新增
            await this.$send_req('/resource_management/create_driver', {
                name: driver_name,
                type_id: parseInt(this.driver_form.type_id)
            });
            }
            this.add_driver_diag = false;
            this.refresh();
        },
        update_driver(driver) {
            this.isEditDriver = true;
            this.editingDriverId = driver.id;
            this.driver_form = {
            name: driver.name,
            type_id: driver.type_id,
            };
            this.add_driver_diag = true;
        },
        prepare_add_driver() {
            this.isEditDriver = false;
            this.editingDriverId = null;
            this.driver_form = {
            name: '',
            type_id: null,
            };
            this.add_driver_diag = true;
        },
        delete_driver: async function (driver) {
            try {
                await this.$confirm(`确定删除驱动 ${driver.name} 吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await this.$send_req('/resource_management/delete_driver', {
                    driver_id: driver.id
                });
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        update_device: function (device) {
            this.isEditDevice = true;
            this.editingDeviceId = device.id;
            this.device_form = {
                name: device.name,
                driver_id: device.driverId,
                connection_key: device.connection_key,
            };
            this.add_device_diag = true;
        },
        prepare_add_device: function () {
            this.isEditDevice = false;
            this.editingDeviceId = null;
            this.device_form = {
                name: '',
                driver_id: null,
                connection_key: '',
            };
            this.add_device_diag = true;
        },
        async add_device() {
            let valid = await this.$refs.device_form.validate();
            if (!valid) return;
            if (this.isEditDevice && this.editingDeviceId) {
                await this.$send_req('/resource_management/update_device', {
                    device_id: this.editingDeviceId,
                    driver_id: this.device_form.driver_id,
                    name: this.device_form.name,
                    connection_key: this.device_form.connection_key,
                });
            } else {
                await this.$send_req('/resource_management/add_device', {
                    driver_id: this.device_form.driver_id,
                    name: this.device_form.name,
                    connection_key: this.device_form.connection_key,
                });
            }
            this.add_device_diag = false;
            this.refresh();
        },
    },
}
</script>

<style></style>
