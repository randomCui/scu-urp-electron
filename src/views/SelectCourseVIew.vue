<template>
  <div>
    <form style="display: grid">
      <div>
        <input v-model="search_filter.name" placeholder="课程名">
      </div>
      <div>
        <input v-model="search_filter.number" placeholder="课程号">
      </div>
      <div>
        <input v-model="search_filter.teacher" placeholder="授课教师">
      </div>
      <div>
        <input @click="sendSearchFilterToIPC" type="button" value="搜索">
        <input @click="altSearch" type="button" value="代替搜索">
      </div>
    </form>
    <ul>
      <li :class="{active: course_selected.has(course.ID)}" v-bind:key="course.ID" v-for="course in courses">
        <div>
          <div>
            <h3>{{ course.name }}</h3>
            <p>{{ course.number }}-{{ course.seqNumber }}</p>
            <p>{{ course.teacher }}</p>
          </div>
          <div>
            <br>
            <p>{{ course.building + " " + course.classroom }}</p>
            <p>
              {{ "星期" + course.weekday + "  " + course.startSection + "到" + (Number.parseInt(course.startSection) + Number.parseInt(course.duringSection)) + "节"
              }}</p>
          </div>
          <div>
            <br>
            <p>总容量: {{ course.capacity }}</p>
            <p>课余量: {{ course.remain }}</p>
          </div>
          <div>
            <input @click="toggleSelection(course.ID)" type="button" value="加入课程">
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
  mounted() {
    window.ipc.invoke("get_course_list_cached").then(res => {
      return JSON.parse(res);
    }).then(json => {
      this.courses = json;
    });
    window.ipc.invoke("modify_selection_list", JSON.stringify({
        op: "get cache"
      })
    ).then(res => {
      return JSON.parse(res);
    }).then(json => {
      this.course_selected = new Set(json);
    });
  },
  methods: {
    sendSearchFilterToIPC() {
      window.ipc.invoke("get_course_list", JSON.stringify(this.search_filter)).then(res => {
        return JSON.parse(res);
      }).then(json => {
        console.log(json);
        this.courses = json;
      });
    },

    altSearch() {
      window.ipc.invoke("get_course_list_alt", JSON.stringify(this.search_filter)).then(res => {
        return JSON.parse(res);
      }).then(json => {
        this.courses = json;
      });
    },

    toggleSelection(uid) {
      if (this.course_selected.has(uid)) {
        this.course_selected.delete(uid);
        window.ipc.invoke("modify_selection_list", JSON.stringify({
          op: "rm",
          course_ID: uid
        }));
      } else {
        this.course_selected.add(uid);
        window.ipc.invoke("modify_selection_list", JSON.stringify({
          op: "add",
          course_ID: uid
        }));
      }
      console.log(this.course_selected);
      // window.ipc.invoke("modify_selection_list")
    }
  }
};
</script>

<style scoped>
ul {
  list-style-type: disclosure-open;
}

li > div {
  display: flex;
  flex-direction: row;
  list-style-type: square;
  justify-content: space-around;
}

li > div > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.active {
  background: #42b98340;
}
</style>
