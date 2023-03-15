// src/preload.js
import { contextBridge, ipcRenderer } from "electron";

const validChannels = [
  // channel for LoginView
  "refresh_captcha",
  "post_login_info",
  "init_urp_login",
  "urp_login_state",

  // channel for SelectCourseView
  "get_course_list",
  "modify_pending_list",

];
contextBridge.exposeInMainWorld(
  "ipc", {
    send: (channel, data) => {
      if (validChannels.includes(channel)) {
        // ignore call from a untrusted channel for security reason
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, data) => {
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    }
  }
);
