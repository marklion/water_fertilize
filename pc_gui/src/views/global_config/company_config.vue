<template>
<div class="company_config_show">
    <page-content ref="all_companies" body_key="companies" enable req_url="/global/get_companies">
        <template v-slot:default="slotProps">
            <div style="height:80vh">
                <el-table :data="slotProps.content" style="width: 100%">
                    <el-table-column prop="name" label="公司名称" />
                    <el-table-column>
                        <template slot="header">
                            <el-button size="mini" type="success" @click="create_company">新增</el-button>
                        </template>
                        <template slot-scope="scope">
                            <el-button size="mini" type="danger" @click="delete_company(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
    </page-content>
</div>
</template>

<script>
import PageContent from '../../components/PageContent.vue';
export default {
    name: 'CompanyConfig',
    components: {
        "page-content": PageContent
    },
    data: function () {
        return {};
    },
    methods: {
        refresh: function () {
            this.$refs.all_companies.refresh();
        },
        create_company: async function () {
            try {
                let company_name = await this.$prompt('请输入公司名称', '新增公司', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputPattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
                    inputErrorMessage: '公司名称只能包含中文、英文、数字和下划线'
                });
                await this.$send_req('/global/create_company', {
                    name: company_name.value
                });
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        },
        delete_company: async function (company) {
            try {
                await this.$confirm(`确定删除公司 ${company.name} 吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await this.$send_req('/global/delete_company', {
                    company_id: company.id
                });
                this.refresh();
            } catch (error) {
                console.log(error);
            }
        }
    },

}
</script>

<style>

</style>
