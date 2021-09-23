<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <div>122</div>
  <liHelloWorld msg="Hello 傲夫靠斯" />
  <li-button>点我-傲夫靠斯</li-button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  components: {},
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
