<template>
  <div>
    <input @click="refresh_remains_once" :disabled="isQuery" type="button" value="刷新一次">
    <input @click="toggle_refresh" type="button" :value="isQuery? '暂停' : '开始'">
    <input v-model="interval" type="number" maxlength="5" minlength="4">
  </div>
  <div>
    <h3>当前状态: {{isQuery? "查询" : "等待"}}</h3>
    <h3>开始时间: {{startTime}}</h3>
    <h3>上次轮询用时: {{lastQuerySuccessTime-lastQueryStartTime || 0}}</h3>
  </div>
  <ul>
    <li>

    </li>
  </ul>
</template>

<script>
export default {
  name: "CourseScheduleView",
  data(){
    return{
      isQuery: false,
      queryIntervalSeq: undefined,
      interval: 1000,
      startTime: new Date(),
      lastQueryStartTime: undefined,
      lastQuerySuccessTime: undefined,
    }
  },
  methods: {
    refresh_remains_once(){
      this.isQuery = true;
      window.ipc.invoke('refresh_remains').then(()=>{
        this.isQuery = false;
      })
    },
    toggle_refresh(){
      console.log("触发了一次")
      if(!this.isQuery){
        this.isQuery=true;
        this.trigger_refresh_once()
      }else{
        this.isQuery = false;
        clearTimeout(this.queryIntervalSeq);
      }
    },
    async trigger_refresh_once(){
      this.lastQueryStartTime = new Date().getTime()
      console.log(this.lastQueryStartTime)
      await window.ipc.invoke('refresh_remains').then(()=>{
        this.lastQuerySuccessTime = new Date().getTime()
        console.log(this.lastQuerySuccessTime)
      })
      this.queryIntervalSeq = setTimeout(async ()=> {
        await this.trigger_refresh_once()
        if(!this.isQuery){
          return;
        }
      },this.interval)
    },
  }
}
</script>

<style scoped>

</style>
