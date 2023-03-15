<template>
  <div>
    <form style="display: grid">
      <input v-model="search_filter.name" placeholder="课程名">
      <input v-model="search_filter.number" placeholder="课程号">
      <input v-model="search_filter.teacher" placeholder="授课教师">
      <input @click="sendSearchFilterToIPC" type="button" value="搜索">
    </form>
      <ul>
      <li :class="{active: course_selected.has(course.id)}" v-bind:key="course.id" v-for="course in courses">
        <div>
          <div>
            <h3>{{ course.kcm }}</h3>
            <p>{{ course.kch }}-{{course.kxh}}</p>
            <p>{{ course.skjs }}</p>
          </div>
          <div>
            <br>
            <p>{{course.jxlm + ' ' + course.jasm}}</p>
            <p>{{'星期'+course.skxq+'  '+course.skjc+'到'+(Number.parseInt(course.skjc)+Number.parseInt(course.cxjc))+'节'}}</p>
          </div>
          <div>
            <br>
            <p>总容量: {{course.bkskrl}}</p>
            <p>课余量: {{course.bkskyl}}</p>
          </div>
          <div>
            <input @click="toggleSelection(course.id)" type="button" value="加入课程">
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "SelectCourseVIew",
  data() {
    return {
      courses: [],
      search_filter: {
        name: "",
        teacher: "",
        number: ""
      },
      course_selected: new Set()
    };
  },
  methods: {
    sendSearchFilterToIPC(){
      window.ipc.invoke('get_course_list',JSON.stringify(this.search_filter)).then(res=>{
        return JSON.parse(res)
      }).then(json=>{
        this.courses = json
      })
    },
    toggleSelection(uid){
      if (this.course_selected.has(uid)){
        this.course_selected.delete(uid)
        window.ipc.invoke("modify_selection_list",JSON.stringify({
          op: "rm",
          course_ID: uid,
        }))
      }else{
        this.course_selected.add(uid)
        window.ipc.invoke("modify_selection_list", JSON.stringify({
          op: "add",
          course_ID: uid,
        }))
      }
      console.log(this.course_selected)
      // window.ipc.invoke("modify_selection_list")
    }
  }
};
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

  .active{
    background: #42b98340;
  }
</style>
