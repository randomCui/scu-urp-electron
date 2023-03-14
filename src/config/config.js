const domain = 'http://202.115.47.141';
// 教务系统登录入口
const jwc_entry_url = domain + '/login';
// 教务系统验证码获取
const jwc_captcha_url = domain + '/img/captcha.jpg';
// 教务系统登录验证
const jwc_jc = domain + '/j_spring_security_check';
// 教务系统首页
const jwc_home = domain;
// 教务系统自由选课提交接口
const course_select_submit_url = domain + '/student/courseSelect/selectCourse/checkInputCodeAndSubmit';
// 教务系统自由选课搜索api
const course_select_search_url = domain + '/student/courseSelect/freeCourse/courseList';
// 教务系统选课页面
const course_select_entry_url = domain + '/student/courseSelect/courseSelect/index';

const curriculum_query_url = domain + '/student/courseSelect/thisSemesterCurriculum/callback';

const course_select_result_query_url  = domain + '/student/courseSelect/selectResult/query';

const course_query_waiting_for_url = domain + '/student/courseSelect/selectCourses/waitingfor';

const course_query_waiting_for_result_url = domain + '/student/courseSelect/selectResult/query';

const delete_course_entry_url = domain + '/student/courseSelect/quitCourse/index';

const delete_course_submit_url = domain + '/student/courseSelect/delCourse/deleteOne';

const http_head = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.163 Safari/535.1";

let JSESSIONID = '';
let isLogin = false;

module.exports = {
    jwc_entry_url,
    jwc_captcha_url,
    jwc_jc,
    jwc_home,
    course_select_submit_url,
    course_select_entry_url,
    course_select_search_url,
    http_head,
    JSESSIONID,
    isLogin,
    curriculum_query_url,
    course_select_result_query_url,
    course_query_waiting_for_url,
    course_query_waiting_for_result_url,
    delete_course_entry_url,
    delete_course_submit_url,
}
