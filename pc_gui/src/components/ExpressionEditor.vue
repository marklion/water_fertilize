<template>
  <div class="expr-editor">
    <div class="expr-row">
      <el-select v-model="type" class="expr-type-select" size="mini">
        <el-option label="运算" value="operator"/>
        <el-option label="变量" value="pv_id"/>
        <el-option label="数据源" value="pds_id"/>
        <el-option label="常量" value="constant_value"/>
        <el-option label="时长" value="duration"/>
      </el-select>
      <template v-if="type==='operator'">
        <el-select v-model="localValue.operator" class="expr-op-select" placeholder="选择运算符" size="mini">
          <el-option label="加" value="+"/>
          <el-option label="减" value="-"/>
          <el-option label="乘" value="*"/>
          <el-option label="除" value="/"/>
        </el-select>
      </template>
      <template v-else-if="type==='pv_id'">
        <el-select v-model="localValue.pv_id" class="expr-value-select" placeholder="选择变量" size="mini">
          <el-option v-for="item in variables" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </template>
      <template v-else-if="type==='pds_id'">
        <el-select v-model="localValue.pds_id" class="expr-value-select" placeholder="选择数据源" size="mini">
          <el-option v-for="item in dataSources" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </template>
      <template v-else-if="type==='constant_value'">
        <el-input v-model.number="localValue.constant_value" class="expr-value-input" placeholder="输入常量" size="mini" />
      </template>
      <template v-else-if="type==='duration'">
        <el-input v-model.number="localValue.duration" class="expr-value-input" placeholder="输入时长（秒）" size="mini" />
      </template>
      <el-button v-if="canRemove" @click="onRemove" type="danger" icon="el-icon-delete" circle size="mini" style="margin-left:8px" title="删除本层" />
    </div>
    <template v-if="type==='operator'">
      <div class="expr-children-row">
        <div class="expr-child-card">
          <div class="expr-child-label">左侧表达式</div>
          <ExpressionEditor v-model="localValue.left" :variables="variables" :dataSources="dataSources" :level="level+1" :maxLevel="maxLevel" canRemove @remove="removeChild('left')"/>
        </div>
        <div class="expr-child-card">
          <div class="expr-child-label">右侧表达式</div>
          <ExpressionEditor v-model="localValue.right" :variables="variables" :dataSources="dataSources" :level="level+1" :maxLevel="maxLevel" canRemove @remove="removeChild('right')"/>
        </div>
      </div>
      <div v-if="level >= maxLevel" style="color:#f56c6c;margin-left:16px">已达最大嵌套层级</div>
    </template>
  </div>
</template>

<script>
import ExpressionEditor from './ExpressionEditor.vue'
export default {
  name: 'ExpressionEditor',
  props: {
    value: { type: Object, required: true },
    variables: { type: Array, default: () => [] },
    dataSources: { type: Array, default: () => [] },
    level: { type: Number, default: 1 },
    maxLevel: { type: Number, default: 5 },
    canRemove: { type: Boolean, default: false }
  },
  data() {
    return {
      localValue: this.value ? { ...this.value } : {},
      type: this.detectType(this.value) || 'constant_value'
    }
  },
  watch: {
    value: {
      handler(val) {
        if (JSON.stringify(val) !== JSON.stringify(this.localValue)) {
          this.localValue = val ? { ...val } : {};
          this.type = this.detectType(val) || 'constant_value';
        }
      },
      deep: true,
      immediate: true
    },
    localValue: {
      handler(val) {
        this.$emit('input', val);
      },
      deep: true
    },
    type(val, oldVal) {
      if (val !== oldVal) {
        if (val === 'operator') {
          this.localValue = { operator: '+', left: {}, right: {} };
        } else if (val === 'pv_id') {
          this.localValue = { pv_id: null };
        } else if (val === 'pds_id') {
          this.localValue = { pds_id: null };
        } else if (val === 'constant_value') {
          this.localValue = { constant_value: 0 };
        } else if (val === 'duration') {
          this.localValue = { duration: 0 };
        }
      }
    }
  },
  methods: {
    detectType(val) {
      if (!val) return 'constant_value';
      if (val.operator) return 'operator';
      if (val.pv_id !== undefined) return 'pv_id';
      if (val.pds_id !== undefined) return 'pds_id';
      if (val.constant_value !== undefined) return 'constant_value';
      if (val.duration !== undefined) return 'duration';
      return 'constant_value';
    },
    onRemove() {
      this.$emit('remove');
    },
    removeChild(side) {
      // 删除子表达式时将其置空
      if (side === 'left') this.localValue.left = {};
      if (side === 'right') this.localValue.right = {};
    }
  },
  components: {
    ExpressionEditor
  }
}
</script>

<style scoped>
.expr-editor {
  margin-bottom: 8px;
  background: #fafdff;
  border-radius: 8px;
  padding: 10px 12px 6px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  max-width: 100%;
  overflow-x: auto;
}
.expr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.expr-type-select {
  min-width: 43px;
  font-size: 10.8px;
}
.expr-op-select {
  min-width: 25px;
  font-size: 10.8px;
}
.expr-value-select {
  min-width: 36px;
  font-size: 10.8px;
}
.expr-value-input {
  min-width: 32px;
  font-size: 10.8px;
}
.expr-children-row {
  display: flex;
  gap: 18px;
  margin-top: 8px;
  flex-wrap: wrap;
  max-width: 100%;
}
.expr-child-card {
  background: #f4f8fb;
  border: 1.5px solid #d3e0ea;
  border-radius: 8px;
  padding: 10px 10px 6px 10px;
  min-width: 220px;
  flex: 1 1 220px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  max-width: 100%;
  overflow-x: auto;
}
.expr-child-label {
  font-size: 13px;
  color: #409EFF;
  margin-bottom: 4px;
  font-weight: bold;
}
</style> 