<template>
  <div>
    <form style="display: grid">
      <input v-model="search_filter.name" placeholder="课程名">
      <input v-model="search_filter.number" placeholder="课程号">
      <input v-model="search_filter.teacher" placeholder="授课教师">
      <input @click="sendSearchFilterToIPC" type="button" value="搜索">
    </form>
      <ul>
      <li v-bind:key="course.kch" v-for="course in courses">
        课程名: {{ course.kcm }}
        课程号: {{ course.kch }}
        教室: {{ course.skjs }}
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
      }
    };
  },
  methods: {
    sendSearchFilterToIPC(){
      window.ipc.invoke('get_course_list',JSON.stringify(this.search_filter)).then(res=>{
        console.log(res)
        return JSON.parse(res)
      }).then(json=>{
        this.courses = json
      })
    }
  }
};
</script>

<style scoped>

</style>
