import { course_select_search_url, http_head } from "@/config/config";
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default class CourseQuery {
  constructor(JSESSIONID) {
    this.JSESSIONID = JSESSIONID;
    this.cachedCourse = [];
  }

  async searchCourse(filter) {
    return await fetch(course_select_search_url, {
      headers: {
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cookie": this.JSESSIONID,
        "User-Agent": http_head
      },
      method:"POST",
      body: new URLSearchParams({
        kkxks: "",
        kch: filter.number || "",
        kcm: filter.name || "",
        skjs: filter.teacher || "",
        xq: 0,
        jc: 0,
        kclbdm: ""
      })
    }).then(res=> {
      return res.json();
    }).then(json=>{
      console.log(json)
      return json.rwRxkZlList;
    });
  }

  setJSESSIONID(JSESSIONID){
    this.JSESSIONID = JSESSIONID
  }

}