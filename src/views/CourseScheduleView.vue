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
    <li v-for="course in course_list" :key="course.ID">
      <div>
        <div>
          <h3>{{ course.name }}</h3>
          <p>{{ course.number }}-{{course.seqNumber}}</p>
          <p>{{ course.teacher }}</p>
        </div>
        <div>
          <br>
          <p>{{course.building + ' ' + course.classroom}}</p>
          <p>{{'星期'+course.weekday+'  '+course.startSection+'到'+(Number.parseInt(course.startSection)+Number.parseInt(course.duringSection))+'节'}}</p>
        </div>
        <div>
          <br>
          <p>总容量: {{course.capacity}}</p>
          <p>课余量: {{course.remain}}</p>
        </div>
        <div>
          <br>
          <p>上次轮询用时: {{course.lastQueryTimeElapse}}ms</p>
          <p>状态: {{course.status}}</p>
          <p>重试次数: {{course.triedTimes}}</p>
        </div>
      </div>
      <div>
        <p v-for="log in course.eventlog" :key="log">{{log}}</p>
      </div>
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
      course_list: []
    }
  },
  mounted() {
    this.refresh_pending_list()
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
      this.refresh_pending_list()
      this.lastQueryStartTime = new Date().getTime()
      console.log(this.lastQueryStartTime)
      Promise.allSettled()
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
    refresh_pending_list(){
      window.ipc.invoke("modify_pending_list",JSON.stringify({
        op: "get list"
      })).then(res=>{
        let json = JSON.parse(res)
        this.course_list = json;
      })
    }
  }
}
</script>

<style scoped>
ul{
  list-style-type: disclosure-open;
}
li > div{
  display: flex;
  flex-direction: row;
  list-style-type: square;
  justify-content: space-around;
}
li > div > div{
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

</style>
