<template>
  <div class="condition-group">
    <el-input v-if="!canRemove" v-model="group.description" size="mini" class="group-desc" placeholder="请输入转移条件（必填）" clearable />
    <div class="logic-select">
      <el-select v-model="group.logicType" size="mini" class="logic-type-select">
        <el-option label="AND" value="and"></el-option>
        <el-option label="OR" value="or"></el-option>
      </el-select>
      <el-button @click="addCondition" size="mini" type="primary" icon="el-icon-plus" circle title="添加条件"></el-button>
      <el-button @click="addGroup" size="mini" type="success" icon="el-icon-folder-add" circle title="添加嵌套组"></el-button>
      <el-button v-if="canRemove" @click="$emit('remove')" size="mini" type="danger" icon="el-icon-delete" circle title="删除组"></el-button>
      <span class="logic-label">{{ group.logicType === 'and' ? '且' : '或' }}</span>
    </div>
    <div class="condition-list">
      <div v-for="(cond, idx) in group.conditions" :key="cond.id || idx" class="condition-item">
        <ConditionGroup
          v-if="cond.logicType"
          :group="cond"
          :canRemove="true"
          :dataSources="dataSources"
          :variables="variables"
          @remove="removeCondition(idx)"
        />
        <div v-else class="base-condition">
          <el-select v-model="cond.leftType" placeholder="左变量类型" size="mini" class="var-type">
            <el-option label="数据源" value="pds_id"></el-option>
            <el-option label="变量" value="pv_id"></el-option>
            <el-option label="偏移量" value="offset_pds_id"></el-option>
            <el-option label="时长" value="duration"></el-option>
            <el-option label="常量" value="constant_value"></el-option>
          </el-select>
          <el-select v-if="cond.leftType==='pds_id'" v-model="cond.leftValue" placeholder="选择数据源" size="mini" class="var-value">
            <el-option v-for="item in dataSources" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select v-else-if="cond.leftType==='pv_id'" v-model="cond.leftValue" placeholder="选择变量" size="mini" class="var-value">
            <el-option v-for="item in variables" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-input v-else v-model="cond.leftValue" placeholder="左变量值" size="mini" class="var-value" />

          <el-select v-model="cond.operator" placeholder="操作符" size="mini" class="op-type">
            <el-option label="==" value="=="></el-option>
            <el-option label=">" value=">"></el-option>
            <el-option label="<" value="<"></el-option>
            <el-option label=">=" value=">="></el-option>
            <el-option label="<=" value="<="></el-option>
          </el-select>

          <el-select v-model="cond.rightType" placeholder="右变量类型" size="mini" class="var-type">
            <el-option label="数据源" value="pds_id"></el-option>
            <el-option label="变量" value="pv_id"></el-option>
            <el-option label="偏移量" value="offset_pds_id"></el-option>
            <el-option label="时长" value="duration"></el-option>
            <el-option label="常量" value="constant_value"></el-option>
          </el-select>
          <el-select v-if="cond.rightType==='pds_id'" v-model="cond.rightValue" placeholder="选择数据源" size="mini" class="var-value">
            <el-option v-for="item in dataSources" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select v-else-if="cond.rightType==='pv_id'" v-model="cond.rightValue" placeholder="选择变量" size="mini" class="var-value">
            <el-option v-for="item in variables" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-input v-else v-model="cond.rightValue" placeholder="右变量值" size="mini" class="var-value" />

          <el-button @click="removeCondition(idx)" size="mini" type="danger" icon="el-icon-delete" circle title="删除条件"></el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConditionGroup',
  props: {
    group: { type: Object, required: true },
    canRemove: { type: Boolean, default: false },
    dataSources: { type: Array, default: () => [] },
    variables: { type: Array, default: () => [] }
  },
  methods: {
    addCondition() {
      if (!this.group.conditions) this.$set(this.group, 'conditions', []);
      this.group.conditions.push({
        id: this.generateId(),
        leftType: '',
        leftValue: '',
        operator: '',
        rightType: '',
        rightValue: ''
      });
    },
    addGroup() {
      if (!this.group.conditions) this.$set(this.group, 'conditions', []);
      this.group.conditions.push({
        id: this.generateId(),
        logicType: 'and',
        conditions: [],
        description: ''
      });
    },
    removeCondition(idx) {
      this.group.conditions.splice(idx, 1);
    },
    generateId() {
      return Math.random().toString(36).substr(2, 9);
    },
    exportToJson(group = this.group) {
      const arr = (group.conditions || []).map(cond => {
        if (cond.logicType) {
          return this.exportToJson(cond);
        } else {
          return {
            left: cond.leftType ? { [cond.leftType]: this.parseValue(cond.leftValue) } : {},
            right: cond.rightType ? { [cond.rightType]: this.parseValue(cond.rightValue) } : {},
            operator: cond.operator
          };
        }
      });
      return { [group.logicType]: arr };
    },
    parseValue(val) {
      if (typeof val === 'string' && val !== '' && !isNaN(val)) return Number(val);
      return val;
    }
  },
  components: {
    ConditionGroup: () => import('./ConditionGroup.vue')
  }
}
</script>

<style scoped>
.condition-group {
  border: 2px solid #d3e0ea;
  border-radius: 10px;
  padding: 12px 16px 8px 16px;
  margin-bottom: 12px;
  background: #fafdff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s;
}
.condition-group:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.group-desc {
  margin-bottom: 6px;
  width: 98%;
  font-size: 14px;
}
.logic-select {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}
.logic-type-select {
  width: 100px;
}
.logic-label {
  color: #409EFF;
  font-weight: bold;
  margin-left: 6px;
  font-size: 13px;
}
.condition-list {
  margin-left: 18px;
  margin-top: 2px;
}
.condition-item {
  margin-bottom: 6px;
}
.base-condition {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f4f8fb;
  border-radius: 6px;
  padding: 4px 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.var-type {
  width: 110px;
}
.var-value {
  width: 140px;
}
.op-type {
  width: 80px;
}
</style>
