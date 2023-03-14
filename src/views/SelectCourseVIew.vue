<template>
  <div>
    <ul>
      <li v-bind:key="course.kch" v-for="course in courses">
        课程名: {{course.kcm}}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "SelectCourseVIew",
  data() {
    return{
      courses:[
        {
          kcm : "JBM",
          kch : 114514,
        },
        {
          kcm: "微积分",
          kch: 1919810,
        }
      ]
  }
  }
}
</script>

<style scoped>

</style>
