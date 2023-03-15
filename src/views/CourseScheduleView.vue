<template>
  <div>
    <input @click="refresh_remains_once" type="button" value="开导">
    <ul>

    </ul>
  </div>
</template>

<script>
export default {
  name: "CourseScheduleView",
  methods: {
    refresh_remains_once(){
      window.ipc.invoke('refresh_remains')
    }
  }
}
</script>

<style scoped>

</style>
