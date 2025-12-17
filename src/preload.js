const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid channels for security
const validSendChannels = ['toggle-bot', 'toggle-module', 'send-command'];
const validReceiveChannels = ['log-message', 'bot-status-update'];
const validHandleChannels = ['get-bot-configs', 'get-bot-state'];

contextBridge.exposeInMainWorld('api', {
  // Renderer to Main (one-way)
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Renderer to Main (two-way)
  invoke: (channel, data) => {
    if (validHandleChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  // Main to Renderer
  on: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` which can be a security risk
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);

      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  }
});
