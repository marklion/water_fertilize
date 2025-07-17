<template>
<div class="policy_state_show">
    <div class="single_state_show" v-for="single_state in policy_state_nodes" :key="single_state.id">
        <el-descriptions :title="single_state.name" direction="vertical" :column="3" border >
            <el-descriptions-item label="进入动作">
                <span v-for="single_action in single_state.enter_actions" :key="single_action.id">
                    <el-tag :closable="editable" @close="del_action(single_action)" size="mini" type="primary">{{state_action_show(single_action)}}</el-tag>
                </span>
            </el-descriptions-item>
            <el-descriptions-item label="持续动作">
                <span v-for="single_action in single_state.do_actions" :key="single_action.id">
                    <el-tag :closable="editable" @close="del_action(single_action)" size="mini" type="success">{{state_action_show(single_action)}}</el-tag>
                </span>
            </el-descriptions-item>
            <el-descriptions-item label="离开动作">
                <span v-for="single_action in single_state.exit_actions" :key="single_action.id">
                    <el-tag :closable="editable" @close="del_action(single_action)" size="mini" type="danger">{{state_action_show(single_action)}}</el-tag>
                </span>
            </el-descriptions-item>
            <template slot="extra" v-if="editable">
                <el-button type="primary" size="mini" @click="prepare_add_action(single_state.id)">添加动作</el-button>
                <el-button type="danger" size="mini" @click="del_state(single_state)">删除状态</el-button>
            </template>
        </el-descriptions>
        <el-divider>变量赋值</el-divider>
        <el-button type="primary" size="mini" style="margin-right: 8px;float: right;margin-bottom: 8px;" @click="prepare_add_varAssignment_action(single_state.id)">添加变量赋值</el-button>
        <el-descriptions direction="vertical" :column="3" border style="margin-bottom: 16px;" >
            <el-descriptions-item label="进入时赋值动作">
                <span v-for="single_assignment in single_state.enter_variable_assignments" :key="single_assignment.id">
                    <el-tag :closable="editable" @close="del_variable_assignment(single_assignment)" size="mini" type="success">
                        {{ state_variable_assignment_show(single_assignment) }}
                    </el-tag>
                </span>
            </el-descriptions-item>
            <el-descriptions-item label="持续时赋值动作">
                <span v-for="single_assignment in single_state.do_variable_assignments" :key="single_assignment.id">
                    <el-tag :closable="editable" @close="del_variable_assignment(single_assignment)" size="mini" type="warning">
                        {{ state_variable_assignment_show(single_assignment) }}
                    </el-tag>
                </span>
            </el-descriptions-item>
            <el-descriptions-item label="离开时赋值动作">
                <span v-for="single_assignment in single_state.exit_variable_assignments" :key="single_assignment.id">
                    <el-tag :closable="editable" @close="del_variable_assignment(single_assignment)" size="mini" type="info">
                        {{ state_variable_assignment_show(single_assignment) }}
                    </el-tag>
                </span>
            </el-descriptions-item>
        </el-descriptions>
        <el-divider>状态转移</el-divider>
        <el-table :data="single_state.from_transitions" style="width: 100%">
            <el-table-column prop="priority" label="优先级" />
            <el-table-column prop="name" label="转移描述" />
            <el-table-column label="目标状态">
                <template slot-scope="scope">
                    <span>{{scope.row.to_state.name}}</span>
                </template>
            </el-table-column>
            <el-table-column v-if="editable" width="150px">
                <template slot="header">
                    <el-button size="mini" type="success" @click="prepare_add_transition(single_state.id)">新增</el-button>
                </template>
                <template slot-scope="scope">
                  <el-button size="mini" type="warning" @click="update_transition(scope.row, single_state.id)">编辑</el-button>
                  <el-button size="mini" type="danger" @click="del_transition(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <el-dialog append-to-body title="新增动作" :visible.sync="add_action_diag" width="50%">
        <el-form :model="action_form" ref="action_form" :rules="action_form_rules">
            <el-form-item label="优先级" prop="priority">
                <el-input v-model="action_form.priority"></el-input>
            </el-form-item>
            <el-form-item label="动作" prop="an_id">
                <el-select v-model="action_form.an_id" placeholder="请选择动作">
                    <el-option v-for="item in action_nodes" :key="item.id" :label="item.name" :value="item.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="动作类型" prop="action_type">
                <el-select v-model="action_form.action_type" placeholder="请选择动作类型">
                    <el-option v-for="item in action_type_options" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_action_diag = false">取消</el-button>
            <el-button type="primary" @click="add_action">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog append-to-body :title="isEditTransition ? '编辑转移条件' : '新增转移条件'" :visible.sync="add_transition_diag" width="50%">
        <el-form :model="transition_form" ref="transition_form" :rules="transition_form_rules">
            <el-form-item label="优先级" prop="priority">
                <el-input v-model="transition_form.priority"></el-input>
            </el-form-item>
            <el-form-item label="目标状态" prop="to_node_id">
                <el-select v-model="transition_form.to_node_id" placeholder="请选择状态">
                    <el-option v-for="item in policy_state_nodes" :key="item.id" :label="item.name" :value="item.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="判断依据" prop="compare_condition">
                <ConditionGroup
                    ref="conditionGroup"
                    :group="transition_form.compare_condition"
                    :dataSources="dataSources"
                    :variables="policyVariables"
                />
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="add_transition_diag= false">取消</el-button>
            <el-button type="primary" @click="add_transition">确定</el-button>
        </span>
    </el-dialog>
    <el-dialog append-to-body title="新增变量赋值" :visible.sync="variableAssignment_diag" width="50%">
        <el-form :model="variableAssignment_form" ref="variableAssignment_form" :rules="variableAssignment_rules">
            <el-form-item label="赋值目标变量" prop="pv_id">
                <el-select v-model="variableAssignment_form.pv_id" placeholder="请选择变量">
                    <el-option v-for="item in policyVariables" :key="item.id" :label="item.name" :value="item.id"/>
                </el-select>
            </el-form-item>
            <el-form-item label="表达式" prop="value">
                <ExpressionEditor
                    v-model="variableAssignment_form.value"
                    :variables="policyVariables"
                    :dataSources="dataSources"
                />
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
                <el-input v-model="variableAssignment_form.priority"></el-input>
            </el-form-item>
            <el-form-item label="动作类型" prop="action_type">
                <el-select v-model="variableAssignment_form.action_type" placeholder="请选择动作类型">
                    <el-option label="进入时赋值" value="enterAssignment"></el-option>
                    <el-option label="持续时赋值" value="doAssignment"></el-option>
                    <el-option label="退出时赋值" value="exitAssignment"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="variableAssignment_diag = false">取消</el-button>
            <el-button type="primary" @click="add_variableAssignment_action">确定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
import ConditionGroup from '@/components/ConditionGroup.vue'
import ExpressionEditor from '@/components/ExpressionEditor.vue'

export default {
    name: 'PolicyState',
    props: {
        policy_state_nodes: {
            type: Array,
            default: () => [],
        },
        action_nodes: {
            type: Array,
            default: () => [],
        },
        data_sources: {
            type: Array,
            default: () => [],
        },
        editable: {
            type: Boolean,
            default: false,
        },
        pt_id: {
            type: Number,
            default: 0,
        },
        template_variable_id: {
            type: [Number, String],
            default: null
        },
        policyVariables: {
            type: Array,
            default: () => []
        },
        dataSources: {
            type: Array,
            default: () => []
        }
    },
    components: {
        ConditionGroup,
        ExpressionEditor,
    },
    data: function () {
        return {
            add_action_diag: false,
            isEditTransition: false,
            action_form: {
                sn_id: 0,
                an_id: 0,
                priority: 0,
                action_type: null, // enter, do, exit
            },
            action_form_rules: {
                sn_id: [
                    { required: true, message: '请选择状态', trigger: 'change' },
                ],
                an_id: [
                    { required: true, message: '请选择动作', trigger: 'change' },
                ],
                priority: [
                    { required: true, message: '请输入优先级', trigger: 'blur' },
                    { pattern: /^\d+$/, message: '优先级必须为数字', trigger: 'blur' },
                ],
                action_type: [
                    { required: true, message: '请选择动作类型', trigger: 'change' },
                ],
            },
            action_type_options: [
                { label: '进入动作', value: 'enter' },
                { label: '持续动作', value: 'do' },
                { label: '离开动作', value: 'exit' },
            ],
            add_transition_diag: false,
            transition_form: {
                from_node_id: 0,
                to_node_id: 0,
                priority: 0,
                compare_condition: {
                  logicType: 'and',
                  conditions: []
                },
            },
            transition_form_rules: {
                from_node_id: [
                    { required: true, message: '请选择起始状态', trigger: 'change' },
                ],
                to_node_id: [
                    { required: true, message: '请选择目标状态', trigger: 'change' },
                ],
                priority: [
                    { required: true, message: '请输入优先级', trigger: 'blur' },
                    { pattern: /^\d+$/, message: '优先级必须为数字', trigger: 'blur' },
                ],
            },
            variableAssignment_diag: false,
            variableAssignment_form: {
                pv_id: 3,
                value: { operator: '+', left: {}, right: {} },
                priority: 0,
                action_type: null
            },
            variableAssignment_rules: {
                pv_id: [
                    { required: true, message: '请选择赋值目标变量', trigger: 'change' }
                ],
                action_type: [
                    { required: true, message: '请选择动作类型', trigger: 'change' }
                ]
            },
            currentStateId: null,
            add_varAssignment_diag: false,
        };
    },
    methods: {
        prepare_add_transition: function (from_node_id) {
            this.isEditTransition = true;
            this.transition_form.from_node_id = from_node_id;
            this.transition_form.to_node_id = null;
            this.transition_form.priority = 0;
            this.transition_form.compare_condition = {
              logicType: 'and',
              conditions: []
            };
            this.add_transition_diag = true;
            
        },
        add_transition: async function () {
        let valid = await this.$refs.transition_form.validate();
        if (!valid) {
            return;
        }
        const description = this.transition_form.compare_condition.description || '';
        if (!description.trim()) {
            this.$message.error('请填写任务含义（description）');
            return;
        }
        const compareConditionJson = this.$refs.conditionGroup.exportToJson();
        if (this.isEditTransition) {
            await this.$send_req('/policy/update_transition', {
            transition_id: this.transition_form.id,
            from_node_id: parseInt(this.transition_form.from_node_id),
            to_node_id: parseInt(this.transition_form.to_node_id),
            priority: parseInt(this.transition_form.priority),
            compare_condition: JSON.stringify(compareConditionJson),
            name: description
            });
        } else {
            await this.$send_req('/policy/add_transition', {
            from_node_id: parseInt(this.transition_form.from_node_id),
            to_node_id: parseInt(this.transition_form.to_node_id),
            priority: parseInt(this.transition_form.priority),
            compare_condition: JSON.stringify(compareConditionJson),
            name: description
            });
        }
        this.prepare_add_transition(0);
        this.add_transition_diag = false;
        this.refresh();
        },
        del_transition: async function (transition) {
            await this.$confirm('确定删除转移条件吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            });
            await this.$send_req('/policy/del_transition', {
                transition_id: transition.id,
            })
            this.refresh();
        },
        del_action: async function (action) {
            await this.$confirm('确定删除动作 ' + action.policy_action_node.name + ' 吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            });
            await this.$send_req('/policy/del_state_action', {
                action_id: action.id,
            })
            this.refresh();
        },
        del_state: async function (state) {
            await this.$confirm('确定删除状态 ' + state.name + ' 吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            });
            await this.$send_req('/policy/del_state_node', {
                sn_id: state.id,
            })
            this.refresh();
        },
        state_action_show: function (sa) {
            return sa.priority + ':' + sa.policy_action_node.name;
        },
        update_transition: function (transition,single_state_id) {
            this.isEditTransition = true;
            const backendCond = typeof transition.compare_condition === 'string'
                ? JSON.parse(transition.compare_condition)
                : transition.compare_condition;
            this.transition_form = {
                ...transition,
                from_node_id: single_state_id,
                to_node_id: transition.to_state.id,
                priority: transition.priority,
                compare_condition: this.backendToComponentGroup(backendCond, transition.name),
            };
            this.add_transition_diag = true;
        },
        backendToComponentGroup(obj, description) {
            const logicType = obj.and ? 'and' : 'or';
            const arr = obj[logicType];
            return {
                logicType,
                description: description,
                conditions: arr.map(item => {
                    if (item.and || item.or) {
                        // 嵌套组
                        return this.backendToComponentGroup(item);
                    } else {
                        // 叶子条件
                        const leftType = Object.keys(item.left)[0];
                        const leftValue = item.left[leftType];
                        const rightType = Object.keys(item.right)[0];
                        const rightValue = item.right[rightType];
                        return {
                            leftType,
                            leftValue,
                            operator: item.operator,
                            rightType,
                            rightValue
                        };
                    }
                })
            };
        },
        prepare_add_action: function (sn_id) {
            this.action_form.sn_id = sn_id;
            this.action_form.an_id = null;
            this.action_form.priority = 0;
            this.action_form.action_type = null;
            this.add_action_diag = true;
        },
        prepare_add_varAssignment_action: function (sn_id) {
            this.variableAssignment_form = {
                pv_id: this.template_variable_id,
                value: { operator: '+', left: {}, right: {} },
                priority: 0,
                action_type: null,
                sn_id: sn_id
            };
            this.variableAssignment_diag = true;
        },
        add_action: async function () {
            let valid = await this.$refs.action_form.validate();
            if (!valid) {
                return;
            }
            await this.$send_req('/policy/add_state_action', {
                sn_id: parseInt(this.action_form.sn_id),
                an_id: parseInt(this.action_form.an_id),
                priority: parseInt(this.action_form.priority),
                action_type: this.action_form.action_type,
            });
            this.prepare_add_action(0);
            this.add_action_diag = false;
            this.refresh();
        },
        refresh: function () {
            this.$emit('refresh');
        },
        add_variableAssignment_action: async function () {
            let valid = await this.$refs.variableAssignment_form.validate();
            if (!valid) return;
            await this.$send_req('/policy/add_variable_assignment_action', {
                sn_id: parseInt(this.variableAssignment_form.sn_id),
                expression: JSON.stringify({
                    pv_id: this.variableAssignment_form.pv_id,
                    value: this.variableAssignment_form.value
                }),
                priority: parseInt(this.variableAssignment_form.priority),
                action_type: this.variableAssignment_form.action_type
            });
            this.variableAssignment_diag = false;
        },
        del_variable_assignment: async function (assignment) {
            await this.$confirm('确定删除变量赋值 ' + this.state_variable_assignment_show(assignment) + ' 吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            });
            await this.$send_req('/policy/del_variable_assignment', {
                assignment_id: assignment.id,
            })
            this.refresh();
        },
        renderExpression: function(expr, policyVariables = []) {
            if (typeof expr === 'string') {
                try {
                    expr = JSON.parse(expr);
                } catch (e) {
                    return expr; 
                }
            }
            if (expr === null || expr === undefined) return '';

            if (expr.constant_value !== undefined) return expr.constant_value;

            if (expr.pv_id !== undefined && expr.value === undefined) {
                let varName = '';
                if (Array.isArray(policyVariables)) {
                    let found = policyVariables.find(v => v.id === expr.pv_id);
                    varName = found ? found.name : `变量${expr.pv_id}`;
                }
                return varName || `变量${expr.pv_id}`;
            }

            if (expr.pv_id !== undefined && expr.value !== undefined) {
                let varName = '';
                if (Array.isArray(policyVariables)) {
                    let found = policyVariables.find(v => v.id === expr.pv_id);
                    varName = found ? found.name : `变量${expr.pv_id}`;
                }
                return `${varName} = ${this.renderExpression(expr.value, policyVariables)}`;
            }

            if (expr.operator && expr.left && expr.right) {
                return `(${this.renderExpression(expr.left, policyVariables)} ${expr.operator} ${this.renderExpression(expr.right, policyVariables)})`;
            }

            if (expr.value !== undefined) return this.renderExpression(expr.value, policyVariables);

            return JSON.stringify(expr);
        },
        state_variable_assignment_show: function (assignment) {
            let varName = assignment.policy_variable ? assignment.policy_variable.name : (assignment.var_name || assignment.variable_name || '变量');
            let expr = assignment.expression || assignment.value || assignment.expr || '';
            let exprShow = this.renderExpression(expr, this.policyVariables);
            let priority = assignment.priority !== undefined ? assignment.priority : '';
            let typeLabel = '';
            if (assignment.action_type === 'enterAssignment' || assignment.action_type === 'enter') typeLabel = '[进入]';
            if (assignment.action_type === 'doAssignment' || assignment.action_type === 'do') typeLabel = '[持续]';
            if (assignment.action_type === 'exitAssignment' || assignment.action_type === 'exit') typeLabel = '[离开]';
            let show = '';
            if (typeof exprShow === 'string' && exprShow.startsWith(varName + ' = ')) {
                show = `${typeLabel}${exprShow}`;
            } else {
                show = `${typeLabel}${varName} = ${exprShow}`;
            }
            if(priority !== '') show += ` (优先级:${priority})`;
            return show;
        },
    },
}
</script>

<style scoped>
.policy_state_show {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    /* 元素间空隙 */
}

.single_state_show {
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1.5px 4px rgba(0, 0, 0, 0.08);
    margin-bottom: 0;
    /* 用gap控制间距 */
    min-width: 380px;
    flex: 1 1 380px;
    transition: box-shadow 0.2s;
    margin-top: 10px;
}

.single_state_show:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 3px 8px rgba(0, 0, 0, 0.10);
}

.el-descriptions {
    background: transparent;
    border-radius: 8px;
}

.el-divider {
    margin: 18px 0;
}

.assign-row {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    flex-wrap: wrap;
    max-width: 100%;
}
.assign-var {
    min-width: 160px;
    max-width: 220px;
}
.assign-eq {
    font-size: 28px;
    font-weight: bold;
    color: #409EFF;
    margin: 0 8px;
    line-height: 40px;
}
.assign-expr-box {
    background: #fafdff;
    border: 2px solid #d3e0ea;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 14px 12px 10px 12px;
    min-width: 220px;
    max-width: 80vw;
    overflow-x: auto;
    flex: 1;
}
.assign-row-simple {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    max-width: 100%;
}
.assign-var-simple {
    min-width: 120px;
    max-width: 180px;
}
.assign-eq-simple {
    font-size: 22px;
    font-weight: bold;
    color: #409EFF;
    margin: 0 6px;
    line-height: 32px;
}
.assign-expr-simple {
    min-width: 180px;
    max-width: 70vw;
    flex: 1;
}
.assign-col-simple {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 100%;
}
.assign-eq-expr-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
}
</style>
