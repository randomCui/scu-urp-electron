const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { http_head } = require("../config/config");

// const {courseList} = require("../../test/自由选课-查询微积分")

export class DesiredCourse {
  constructor(courseObject) {
    // courseObject = courseList.rwRxkZlList[0]
    this.ID = courseObject.id;  // 该课程在教务处的唯一排序号
    this.number = courseObject.kch;  // 课程号
    this.seqNumber = courseObject.kxh;  // 课序号
    this.semester = courseObject.zxjxjhh;  // 执行教学计划号?
    this.name = courseObject.kcm;  // 课程名
    this.teacher = courseObject.skjs;  // 授课教师

    this.campus = courseObject.kkxqm;
    this.building = courseObject.jxlm;
    this.classroom = courseObject.jasm;

    this.weekday = courseObject.skxq;
    this.startSection = courseObject.skjc;
    this.duringSection = courseObject.cxjc;

    this.capacity = courseObject.bkskrl;
    this.remain = courseObject.bkskyl;

    // this.UID = this.ID + '_' + this.subID + '_' + this.semester + '_' + this.name
    this.programPlanNumber = undefined;
    // this.token = undefined;

    this.triedTimes = 0;  // 重试次数
    this.lastSubmitStartTime = undefined;  // 最后提交时间
    this.lastSubmitFinishTime = undefined;  // 最后提交完成时间
    this.firstStartTime = undefined;  // 最初启动时间
    this.lastQueryTimeElapse = 0;

    // 四种状态
    this.status = "queuing";
    // pending (等待响应)
    // suspend (暂停)
    // waiting (等待下一次轮询)
    // submitted (提交成功)
    // success (选课成功)

    this.stopSignal = false;
    this.eventlog = [];

    this.interval = 1000;
    this.timeoutID = null;
  }

  /***************
   * 将该课程提交需要使用的json对象返回
   ***********************
   * dealType: 选课类型 <br>
   * kcIDs: 课程编号 <br>
   * kcms: 课程名 <br>
   * fajhh: 方案计划号(?) <br>
   * sj: (开课)时间 <br>
   * searchtj: 搜索条件 <br>
   * inputcode: 意义不明 <br>
   * tokenValue: 用于选课的token <br>
   *
   * @returns {{kcIds: string, inputcode: string, fajhh, sj: string, searchtj, kclbdm: string, dealType: number, kcms: string, tokenValue}}
   */
  makePost() {
    let make_kcIDs = () => {
      return [this.number, this.seqNumber, this.semester].join("@");
    };
    let make_kcms = () => {
      let convertedString = "";
      for (let char of this.name) {
        convertedString += char.charCodeAt(0).toString(10) + ",";
      }
      return convertedString;
    };
    return {
      "dealType": 5,
      "kcIds": make_kcIDs(),
      "kcms": make_kcms(),
      "fajhh": this.programPlanNumber,
      "sj": "0_0",
      "searchtj": this.name,  // 搜索条件
      "kclbdm": "",
      "inputcode": ""
      // 'tokenValue': this.token,
    };
  }

  setProgramPlanNumber(programPlanNumber) {
    this.programPlanNumber = programPlanNumber;
  }

  updateStatus(occasion) {
    this.status = occasion;
    switch (occasion) {
      case "queuing":
        this.lastSubmitFinishTime = new Date();
        this.lastQueryTimeElapse = this.lastSubmitFinishTime - this.lastSubmitStartTime || 0;
        break;
      case "pending":
        this.lastSubmitStartTime = new Date();
        this.triedTimes += 1;
        break;
      case "submitted":


    }
    // this.status = occasion;
    // if (occasion === 'pending') {
    //     this.triedTimes += 1;
    //     this.lastSubmitStartTime = Date.now();
    //
    // } else if (occasion === 'queue') {
    //     this.lastSubmitFinishTime = Date.now();
    //
    // } else if (occasion === 'suspend') {
    //     this.forceStop = true;
    //     this.triedTimes = 0;
    //     this.lastSubmitFinishTime = Date.now();
    //
    // } else if (occasion === 'submitted') {
    //     this.forceStop = true;
    //     this.lastSubmitFinishTime = Date.now();
    //
    // } else if (occasion === 'success') {
    //     this.forceStop = true;
    // } else if (occasion === 'init') {
    //     this.status = 'queue';
    //     this.firstStartTime = Date.now();
    //     this.lastSubmitStartTime = Date.now();
    // }

  }

  toJSON() {
    return {
      ID: this.ID,
      name: this.name,
      number: this.number,
      seqNumber: this.seqNumber,
      teacher: this.teacher,
      semester: this.semester,
      campus: this.campus,
      building: this.building,
      classroom: this.classroom,
      weekday: this.weekday,
      startSection: this.startSection,
      duringSection: this.duringSection,
      capacity: this.capacity,
      remain: this.remain,
      lastQueryTimeElapse: this.lastQueryTimeElapse,
      status: this.status,
      triedTimes: this.triedTimes,
      eventlog: this.eventlog
    };
  }

  // fromAltSearch(altSearchObj){
  //     this.name
  // }

  startQuery(cookie, programPlanNumber, waitingQueue) {
    this.cookie = cookie;
    this.programPlanNumber = programPlanNumber;
    this.waitingQueue = waitingQueue;
    if (this.status !== "suspend")
      return;
    this.updateStatus("init");
    this.timeoutID = setTimeout(this.enterQueue.bind(this), 0);
  }

  enterQueue() {
    if (this.status === "suspend" || this.status === "success" || this.status === "failed")
      return;

    let timeLeft = this.interval - (Date.now() - this.lastSubmitStartTime);

    if (timeLeft < 50) {
      timeLeft = 50;
    }
    if (Number.isNaN(timeLeft)) {
      timeLeft = 50;
      console.log("nan");
    }

    if (!this.waitingQueue.includes(this) && this.status !== "pending")
      this.waitingQueue.push(this);

    this.timeoutID = setTimeout(this.enterQueue.bind(this), timeLeft);
  }

  async start() {
    const { course_select_submit_url, course_select_entry_url, course_select_search_url } = require("../config/config");
    // const {test_submit_url} = require('../test/test_config')

    let canSubmit = false;
    let hasCourse = false;

    if (this.status === "success" || this.status === "suspend")
      return;

    this.updateStatus("pending");

    // 先拿到tokenValue
    await fetch(course_select_entry_url, {
      headers: {
        "Cookie": this.cookie,
        "User-Agent": http_head
      }
    }).then(response => {
      return response.text();
    }).then(text => {
      this.token = text.match(/id="tokenValue" value="(.*?)"/)[1];
    });

    // 去看是否有课余量
    await fetch(course_select_search_url, {
      method: "POST",
      headers: {
        "Cookie": this.cookie,
        "User-Agent": http_head
      },
      body: new URLSearchParams({
        "searchtj": this.ID,
        "xq": 0,
        "jc": 0,
        "kclbdm": ""
      })
    }).then(response => {
      return response.json();
    }).then(json => {
      for (let course of json["rwRxkZlList"]) {
        // 剔除不匹配的课程
        if (!(course["kch"] === this.ID && course["kxh"] === this.subID && course["kcm"] === this.name && course["zxjxjhh"] === this.semester))
          continue;
        hasCourse = true;
        // 如果课余量>0就准备开始选课
        if (course["bkskyl"] > 0) {
          canSubmit = true;
          break;
        }
      }
    });

    if (canSubmit) {
      // 正式应使用course_select_submit_url
      // console.log(this.makePost());
      // console.log(new URLSearchParams(this.makePost()).toString())
      await fetch(course_select_submit_url, {
        method: "POST",
        headers: {
          "Cookie": this.cookie,
          "User-Agent": http_head
        },
        body: new URLSearchParams(this.makePost())
      }).then(response => {
        return response.json();
      }).then(json => {
        // console.log(json);
        if (json["result"] === "ok") {
          this.updateStatus("submitted");
          this.queryWaitingFor();
        }
      });
    }

    if (this.status === "pending")
      this.updateStatus("queue");

    if (!hasCourse) {
      console.log("搜索不到课程，课程冲突");
    }

  }

  stopQuery() {
    this.updateStatus("suspend");
  }

  changeInterval(interval) {
    if (interval < 0)
      return false;
    else {
      this.interval = interval;
    }
  }

  async queryWaitingFor() {
    const { course_query_waiting_for_url } = require("../config/config");
    let queryPost = this.makePost();
    delete queryPost.tokenValue;
    let queryPayload = await fetch(course_query_waiting_for_url, {
      method: "POST",
      headers: {
        "Cookie": this.cookie,
        "User-Agent": http_head
      },
      body: new URLSearchParams(queryPost)
    }).then(response => {
      return response.text();
    }).then(text => {
      return {
        "kcNum": text.match(/var kcNum = "(.*?)"/)[1],
        "redisKey": text.match(/var redisKey = "(.*?)"/)[1]
      };
    });
    setTimeout(this.queryWaitingForResult.bind(this), 1000, queryPayload, 0);
  }

  async queryWaitingForResult(payload, retry) {
    const { course_query_waiting_for_result_url } = require("../config/config");
    if (retry > 10) {
      console.log("可能出现问题");
      this.updateStatus("suspend");
      return;
    }
    let isFinish = false;

    await fetch(course_query_waiting_for_result_url, {
      method: "POST",
      headers: {
        "Cookie": this.cookie,
        "User-Agent": http_head
      },
      body: new URLSearchParams(payload)
    }).then(response => {
      return response.json();
    }).then(json => {
      if (json["isFinish"] === true) {
        console.log(json["result"]);
        isFinish = true;
        this.eventlog.push(json["result"]);
      }
    });

    if (isFinish)
      return;

    setTimeout(this.queryWaitingForResult.bind(this), 1000, payload, retry + 1);
  }

}

// class CourseScheduler {
//     constructor(cookie, programPlanNumber) {
//         this.cookie = cookie;
//         this.pendingList = [];
//         this.keepSeeking = true;
//         this.searchContext = [];
//         this.programPlanNumber = programPlanNumber;
//         this.fetchQueue = [];
//         this.startQueue();
//     }
//
//     async startQueue() {
//         setTimeout(this.queueExecutor.bind(this), 0);
//     }
//
//     async queueExecutor() {
//         // console.log(this.fetchQueue);
//         while (this.fetchQueue.length > 0) {
//             let queueHead = this.fetchQueue.shift();
//             if (queueHead.status !== 'queue') {
//                 continue;
//             }
//             await queueHead.start(this.cookie, this.programPlanNumber).catch(reason => {
//                 console.log(reason);
//                 queueHead.updateStatus('queue');
//             });
//         }
//         setTimeout(this.queueExecutor.bind(this), 100);
//     }
//
//     async start() {
//         for (let course of this.pendingList) {
//             course.startQuery(this.cookie, this.programPlanNumber, this.fetchQueue);
//         }
//     }
//
//     // async startAll() {
//     //     this.pendingList.forEach(task => {
//     //         // do something
//     //     });
//     //     await this.start();
//     // }
//
//     async stopAll() {
//         this.pendingList.forEach(task => {
//             // task.setEnableStatus(false);
//             task.stopQuery();
//         });
//
//     }
//
//     async searchCourse(searchtj) {
//         const {course_select_search_url, http_head} = require('../config/config');
//         return fetch(course_select_search_url, {
//             method: 'POST',
//             headers: {
//                 'User-Agent': http_head,
//                 'cookie': this.cookie,
//             },
//             body: new URLSearchParams(searchtj),
//         }).then(response => {
//             // console.log(response)
//             return response.text();
//         }).then(text => {
//             // console.log(text)
//             this.searchContext = JSON.parse(text)['rwRxkZlList'];
//             return text;
//         })
//     }
//
//     // async searchCourseAlt(payload) {
//     //     const {zhjwjs_url, zhjwjs_search_url} = require('../test/test_config');
//     //     return await fetch(zhjwjs_url).then(response => {
//     //         return response.headers.get('set-cookie').split(';')[0];
//     //     }).then(cookie => {
//     //         return fetch(zhjwjs_search_url, {
//     //             method: 'POST',
//     //             headers: {
//     //                 'User-Agent': http_head,
//     //                 'cookie': cookie,
//     //             },
//     //             body: new URLSearchParams(payload),
//     //         })
//     //     }).then(response => {
//     //         // console.log(response)
//     //         return response.text();
//     //     }).then(text => {
//     //         this.searchContext = JSON.parse(text)['list']['records'];
//     //         return text;
//     //     })
//     // }
//
//     addCourse(course) {
//         let matchingCourse = this.findMatchingCourse(course);
//         // console.log(matchingCourse);
//         if (!matchingCourse) {
//             return {
//                 'code': -2,
//                 'message': '未在搜索结果中找到对应课程:' + course['kcm']
//             }
//         }
//         if (this.isDuplicatedCourse(matchingCourse) !== -1) {
//             return {
//                 'code': -1,
//                 'message': course['kcm'] + '已存在重复课程，添加失败'
//             }
//         }
//         let temp = new DesiredCourse(course);
//         temp.setProgramPlanNumber(this.programPlanNumber);
//         this.pendingList.push(temp);
//         return {
//             'code': 1,
//             'message': course['kcm'] + '已成功添加'
//         }
//     }
//
//     deleteCourse(course) {
//         let index = this.findMatchingCourseIndex(course);
//         // console.log(index);
//         if (index !== -1)
//             this.pendingList.splice(index, 1);
//     }
//
//     findMatchingCourse(course) {
//         // 应该是要从searchContext里面找到课程
//         return this.searchContext.find((oriCourseInfo) => {
//             let flag = true;
//             if (course['kch'] !== oriCourseInfo['kch'] ||
//                 course['kxh'] !== oriCourseInfo['kxh'] ||
//                 course['zxjxjhh'] !== oriCourseInfo['zxjxjhh'] ||
//                 course['kcm'] !== oriCourseInfo['kcm'])
//                 flag = false;
//             return flag
//         })
//     }
//
//     findMatchingCourseIndex(course) {
//         return this.pendingList.findIndex((storedCourse) => {
//             let flag = true;
//             if (course['kch'] !== storedCourse.ID ||
//                 course['kxh'] !== storedCourse.subID ||
//                 course['zxjxjhh'] !== storedCourse.semester ||
//                 course['kcm'] !== storedCourse.name)
//                 flag = false;
//
//             return flag
//         })
//     }
//
//     isDuplicatedCourse(course) {
//         return this.findMatchingCourseIndex(course);
//     }
//
//     updateCookie(cookie) {
//         this.cookie = cookie;
//     }
//
//     updateProgramPlanNumber(programPlanNumber) {
//         this.programPlanNumber = programPlanNumber;
//     }
//
//     updateInterval(courseInfo, interval) {
//         let index = this.findMatchingCourseIndex(courseInfo);
//         if (index !== -1)
//             this.pendingList[index].interval = interval;
//     }
//
//     getPendingListJson() {
//         let jsonList = []
//         this.pendingList.forEach(course => {
//             jsonList.push(course.toJSON())
//         })
//         // console.log(jsonList);
//         return jsonList;
//     }
//
//     /**************
//      * 检查是否在选课时间
//      * @returns {Promise<boolean>}如果在选课时间返回true  否则返回false
//      */
//     async is_course_selection_time() {
//         const {course_select_entry_url} = require('../config/config')
//         return fetch(course_select_entry_url, {
//             headers: {
//                 'Cookie': this.cookie,
//                 'User-Agent': http_head,
//             },
//         }).then((response) => {
//             return response.text();
//         }).then((text) => {
//             // console.log(text);
//             return text.includes('自由选课');
//         })
//     }
// }


// module.exports = {
//     CourseScheduler,
//     DesiredCourse,
// }
