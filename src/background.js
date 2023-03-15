'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import fetch from "node-fetch";

import path from "path"

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {

            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

/*************************************/

const {jwc_entry_url, jwc_jc, jwc_captcha_url, jwc_home, http_head} = require('../src/config/config');

let JSESSIONID;
let tokenValue;
let isLogin = false;
// let planNumber;
import CourseQuery from "../src/js/queryCourse"

let courseQueryWorker = new CourseQuery(JSESSIONID)

ipcMain.handle("refresh_captcha", async ()=>{
    return await fetch(jwc_captcha_url,{
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': JSESSIONID,
            'User-Agent': http_head,
        },
    })
        .then(res=>{
            return res.buffer()
        }).then(buffer=>{
            return buffer
        })
})

ipcMain.handle('init_urp_login', async () => {
    // electron的ipc不能直接返回blob,因此这里返回arrayBuffer后再在渲染进程中组装成blob
    return await fetch(jwc_entry_url, {
        headers: {
            'User-Agent': http_head,
        },
    }).then(response => {
        // console.log(response)
        console.log(response.headers.get('set-cookie').split(';')[0])
        JSESSIONID = response.headers.get('set-cookie').split(';')[0];
        return response.text()
    }).then(text => {
        let regexp = /id="tokenValue" name="tokenValue" value="(.*?)"/ium
        tokenValue = text.match(regexp)[1];

        // globalCurriculum.updateCookie(globalCookie);
        // globalCourseScheduler.updateCookie(globalCookie);
        // globalCourseDeleter.updateCookie(globalCookie);

        return fetch(jwc_captcha_url, {
            headers: {
                'Cookie': JSESSIONID,
                'User-Agent': http_head,
            },
        })
    }).then(response => {
        console.log('获取验证码成功')
        return response.buffer()
    })
})


ipcMain.handle("post_login_info", async (event,data)=>{
    let {student_id, password, captcha} = JSON.parse(data)
    const md5 = require('md5')
    console.log(student_id,password,captcha)
    let post_data = {
        "j_username": student_id,
        "j_password": md5(password),
        "j_captcha": captcha,
        "tokenValue": tokenValue
    }
    console.log(post_data)
    console.log(JSESSIONID)
    return await fetch(jwc_jc, {
        method: 'POST',
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': JSESSIONID,
            'User-Agent': http_head,
        },
        body: new URLSearchParams(post_data),
    }).then((response) => {
        console.log(response.url);
        if (response.url === jwc_home || response.url === jwc_home + '/') {
            console.log('登陆成功');
            isLogin = true;

            courseQueryWorker.setJSESSIONID(JSESSIONID)

            return {
                'status': 'success',
                'message': '登陆成功'
            };
        } else {
            let url = new URL(response.url);
            let errorCode = url.searchParams.get('errorCode');
            console.log('登陆失败' + errorCode)
            return {
                'status': 'failed',
                'message': '登陆失败' + errorCode,
            }
        }
    })
})

ipcMain.handle('urp_login_state',()=>{
    console.log(isLogin)
    return JSON.stringify(isLogin);
})

ipcMain.handle('get_course_list',async (event, filter)=>{
    return JSON.stringify(await courseQueryWorker.searchCourse(JSON.parse(filter)))
})

