const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const {course_select_submit_url, http_head} = require('./config');

class DesiredCourse {
    constructor({
                    'kch': ID,
                    'kxh': subID,
                    'kcm': name,
                    'zxjxjhh': semester,
                    'fajhh': programPlanNumber,
                    'token': token,
                    ...rest
                }) {
        this.ID = ID;
        this.subID = subID;
        this.semester = semester;
        this.name = name;
        this.programPlanNumber = programPlanNumber;
        this.token = token;
        this.postPayload = this.makePost()
        for (let [key, value] of Object.entries(rest)) {
            this[key] = value;
        }
        this.triedTimes = 0;
        this.lastSubmitStartTime = undefined;
        this.lastSubmitFinishTime = undefined;
        this.firstStartTime = undefined;
        // pending(等待选课返回结果), finish(结果已返回，等待下次提交) 两种状态
        this.status = 'pause';
        // 是否开启抢课功能
        this.enable = 'false';
        this.interval = 1000;
        this.timeoutID = null;
        this.forceStop = false;
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
            return [this.ID, this.subID, this.semester].join('@')
        }
        let make_kcms = () => {
            let convertedString = '';
            for (let char of this.name) {
                convertedString += char.charCodeAt(0).toString(10) + ',';
            }
            return convertedString;
        }
        return {
            'dealType': 5,
            'kcIds': make_kcIDs(),
            'kcms': make_kcms(),
            'fajhh': this.programPlanNumber,
            'sj': '0_0',
            'searchtj': this.name,  // 搜索条件
            'kclbdm': '',
            'inputcode': '',
            'tokenValue': this.token,
        }
    }

    updateStatus(occasion) {
        if (occasion === 'beforeSubmit') {
            this.triedTimes += 1;
            this.status = 'pending';
            this.lastSubmitStartTime = Date.now();

        } else if (occasion === 'afterSubmit') {
            this.lastSubmitFinishTime = Date.now();
            this.status = 'finish';

        } else if (occasion === 'success') {
            this.lastSubmitFinishTime = Date.now();
            this.enable = false;
            this.status = 'success';

        } else if (occasion === 'pause') {
            this.enable = false;
            this.status = 'pause'
        }
    }

    isEnable() {
        return this.enable;
    }

    setEnableStatus(status) {
        this.enable = status;
    }

    toJSON() {
        let translateMap = new Map(
            Object.entries({
                'ID': 'kch',
                'subID': 'kxh',
                'semester': 'zxjxjhh',
                'name': 'kcm',
            })
        );
        let json = {};
        for (let [key, value] of Object.entries(this)) {
            if (key === 'postPayload')
                continue;
            if (key === 'timeoutID')
                continue;
            let newKey = translateMap.get(key) || key;
            json[newKey] = value;
        }
        return json;
    }

    startQuery(cookie) {
        this.cookie = cookie;
        if (this.status === 'success')
            return;
        this.firstStartTime = Date.now();
        this.timeoutID = setTimeout(this.start.bind(this), 0);
    }

    async start() {
        const {test_submit_url} = require('../test/test_config')
        if (this.status === 'pending')
            return;
        this.updateStatus('beforeSubmit')
        // 正式应使用course_select_submit_url
        await fetch(test_submit_url, {
            method: 'POST',
            headers: {
                'Cookie': this.cookie,
                'User-Agent': http_head,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.postPayload),
        }).then(response => {
            return response.text();
        }).then(text => {
            if (text.includes('ok')) {
                this.updateStatus('success');
                return;
            } else {
                if (this.forceStop) {
                    this.updateStatus('pause');
                    this.forceStop = false;
                    return;
                } else {
                    this.updateStatus('afterSubmit');
                }
            }

            let timeLeft = this.interval - (Date.now() - this.lastSubmitStartTime);
            if (timeLeft < 0) {
                timeLeft = 0;
            }

            this.timeoutID = setTimeout(this.start.bind(this), timeLeft);
        })
    }


    stopQuery() {
        this.forceStop = true;
    }

    changeInterval(interval) {
        if (interval < 0)
            return false;
        else {
            this.interval = interval;
        }
    }

}

class CourseScheduler {
    constructor(cookie) {
        this.cookie = cookie;
        this.pendingList = [];
        this.keepSeeking = true;
        this.searchContext = [];
    }

    async start() {
        for (let course of this.pendingList) {
            course.startQuery(this.cookie);
        }
    }

    async startAll() {
        this.pendingList.forEach(task => {
            task.setEnableStatus(true);
        });
        await this.start();
    }

    async stopAll() {
        this.pendingList.forEach(task => {
            // task.setEnableStatus(false);
            task.stopQuery();
        });

    }

    async searchCourseAlt(payload) {
        const {zhjwjs_url, zhjwjs_search_url} = require('../test/test_config');
        return await fetch(zhjwjs_url).then(response => {
            return response.headers.get('set-cookie').split(';')[0];
        }).then(cookie => {
            return fetch(zhjwjs_search_url, {
                method: 'POST',
                headers: {
                    'User-Agent': http_head,
                    'cookie': cookie,
                },
                body: new URLSearchParams(payload),
            })
        }).then(response => {
            // console.log(response)
            return response.text();
        }).then(text => {
            this.searchContext = JSON.parse(text)['list']['records'];
            return text;
        })
    }

    addCourse(course) {
        let matchingCourse = this.findMatchingCourse(course);
        // console.log(matchingCourse);
        if (!matchingCourse) {
            return {
                'code': -2,
                'message': '未在搜索结果中找到对应课程:' + course['kcm']
            }
        }
        if (this.isDuplicatedCourse(matchingCourse) !== -1) {
            return {
                'code': -1,
                'message': course['kcm'] + '已存在重复课程，添加失败'
            }
        }
        this.pendingList.push(new DesiredCourse(course));
        return {
            'code': 1,
            'message': course['kcm'] + '已成功添加'
        }
    }

    deleteCourse(course) {
        let index = this.findMatchingCourseIndex(course);
        // console.log(index);
        if (index !== -1)
            this.pendingList.splice(index, 1);
    }

    findMatchingCourse(course) {
        // 应该是要从searchContext里面找到课程
        return this.searchContext.find((oriCourseInfo) => {
            let flag = true;
            if (course['kch'] !== oriCourseInfo['kch'] ||
                course['kxh'] !== oriCourseInfo['kxh'] ||
                course['zxjxjhh'] !== oriCourseInfo['zxjxjhh'] ||
                course['kcm'] !== oriCourseInfo['kcm'])
                flag = false;
            return flag
        })
    }

    findMatchingCourseIndex(course) {
        return this.pendingList.findIndex((storedCourse) => {
            let flag = true;
            if (course['kch'] !== storedCourse.ID ||
                course['kxh'] !== storedCourse.subID ||
                course['zxjxjhh'] !== storedCourse.semester ||
                course['kcm'] !== storedCourse.name)
                flag = false;

            return flag
        })
    }

    isDuplicatedCourse(course) {
        return this.findMatchingCourseIndex(course);
    }

    updateCookie(cookie) {
        this.cookie = cookie;
    }

    updateInterval(courseInfo, interval) {
        let index = this.findMatchingCourseIndex(courseInfo);
        if (index !== -1)
            this.pendingList[index].interval = interval;
    }

    getPendingListJson() {
        let jsonList = []
        this.pendingList.forEach(course => {
            jsonList.push(course.toJSON())
        })
        // console.log(jsonList);
        return jsonList;
    }
}

/**********
 * 检查目前是否在选课阶段
 *
 * @param cookie
 * @returns {Promise<void>}
 */

async function is_course_selection_time(cookie) {
    const {course_select_search_url} = require('../js/config')
    return fetch(course_select_search_url, {
        headers: {
            'Cookie': this.cookie,
            'User-Agent': http_head,
        },
    }).then((response) => {
        return response.text();
    }).then((text) => {
        return text.includes('自由选课');
    })
}

module.exports = {
    CourseScheduler,
    DesiredCourse,
    is_course_selection_time,
}