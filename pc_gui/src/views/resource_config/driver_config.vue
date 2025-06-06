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
                            <el-table :data="scope.row.modbus_read_meta" style="width: 100%">
                                <el-table-column prop="title" label="标题" />
                                <el-table-column prop="reg_address" label="寄存器地址" />
                                <el-table-column prop="data_type" label="数据类型" />
                                <el-table-column>
                                    <template slot="header">
                                        <el-button size="mini" type="success" @click="prepare_add_meta(scope.row)">新增</el-button>
                                    </template>
                                    <template slot-scope="sub_scope">
                                        <el-button size="mini" type="danger" @click="delete_meta(sub_scope.row)">删除</el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </template>
                    </el-table-column>
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="add_driver_diag = true">新增</el-button>
                        </template>
                        <template slot-scope="scope">
                            <el-button size="mini" type="danger" @click="delete_driver(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
    <el-dialog title="新增驱动" :visible.sync="add_driver_diag" width="50%">
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
    <el-dialog title="新增数据" :visible.sync="add_meta_diag" width="50%">
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
            driver_type: {
                modbus_rtu: {
                    type_id: 1,
                    name: 'Modbus RTU',
                },
            },
            data_type:[
                {data_type:'uint32', name: '无符号32位整数'},
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
        };
    },
    methods: {
        prepare_add_meta: function (driver) {
            this.meta_form = {
                title: '',
                reg_address: '',
                data_type: '',
            };
            this.add_meta_diag = true;
            this.focus_driver = driver;
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
        add_meta: async function () {
            try {
                let valid = await this.$refs.meta_form.validate();
                if (!valid) {
                    return;
                }
                await this.$send_req('/resource_management/add_driver_meta', {
                    driver_id: this.focus_driver.id,
                    title: this.meta_form.title,
                    reg_address: parseInt(this.meta_form.reg_address),
                    data_type: this.meta_form.data_type,
                });
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
        add_driver: async function () {
            try {
                let valid = await this.$refs.driver_form.validate();
                if (!valid) {
                    return;
                }
                await this.$send_req('/resource_management/create_driver', {
                    name: this.driver_form.name,
                    type_id: parseInt(this.driver_form.type_id)
                });
                this.add_driver_diag = false;
                this.refresh();
            } catch (error) {
                console.log(error);
            }
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
    },
}
</script>

<style>

</style>
