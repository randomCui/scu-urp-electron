// src/preload.js
import { contextBridge, ipcRenderer } from 'electron'

// const { contextBridge, ipcRenderer } = require('electron');

const validChannels = [
  'refresh_captcha',
  'post_login_info',
    "init_urp_login",
    "urp_login_state"
];
contextBridge.exposeInMainWorld(
  'ipc', {
    send: (channel, data) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        // Strip event as it includes `sender` and is a security risk
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, data) => {
        if (validChannels.includes(channel)) {
            // Strip event as it includes `sender` and is a security risk
            return ipcRenderer.invoke(channel, data)
        }
    }
  },
);
