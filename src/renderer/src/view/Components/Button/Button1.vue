<script setup lang="ts">
// 定义组件 props
interface Props {
  text?: string           // 按钮文字
  color?: string         // 主色调
  hoverColor?: string    // 悬停时的文字颜色
  padding?: string       // 内边距
  fontSize?: string      // 字体大小
  width?: string         // 宽度
  height?: string        // 高度
  borderWidth?: string   // 边框宽度
  fontWeight?: string    // 字体粗细
  skewAngle?: string     // 倾斜角度
  animationDuration?: string // 动画持续时间
}

// 设置默认值
const props = withDefaults(defineProps<Props>(), {
  text: 'Diagonal Swipe',
  color: 'purple',
  hoverColor: 'white',
  padding: '10px 20px',
  fontSize: '17px',
  width: '240px',
  height: '48px',
  borderWidth: '2px',
  fontWeight: 'bold',
  skewAngle: '45deg',
  animationDuration: '1s'
})
</script>

<template>
  <button 
    class="btn"
    :style="{
      '--btn-color': props.color,
      '--hover-color': props.hoverColor,
      '--btn-padding': props.padding,
      '--font-size': props.fontSize,
      '--btn-width': props.width,
      '--btn-height': props.height,
      '--border-width': props.borderWidth,
      '--font-weight': props.fontWeight,
      '--skew-angle': props.skewAngle,
      '--animation-duration': props.animationDuration
    }"
  >
    {{ props.text }}
  </button>
</template>

<style scoped>
.btn {
  color: var(--btn-color);
  text-transform: uppercase;
  text-decoration: none;
  border: var(--border-width) solid var(--btn-color);
  padding: var(--btn-padding);
  font-size: var(--font-size);
  cursor: pointer;
  font-weight: var(--font-weight);
  background: transparent;
  position: relative;
  transition: all var(--animation-duration);
  overflow: hidden;
  width: var(--btn-width);
  height: var(--btn-height);
}

.btn:hover {
  color: var(--hover-color);
}

.btn::before {
  content: "";
  position: absolute;
  height: 100%;
  width: 0%;
  top: 0;
  left: -40px;
  transform: skewX(var(--skew-angle));
  background-color: var(--btn-color);
  z-index: -1;
  transition: all var(--animation-duration);
}

.btn:hover::before {
  width: 160%;
}
</style>
