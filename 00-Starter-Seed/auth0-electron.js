'use strict';
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;

window.electron = {};

Auth0Lock._setOpenWindowFn(function(url, name, options) {
  let listeners = [];

  const win = new BrowserWindow({show: false, webPreferences: { nodeIntegration: false }});
  win.loadURL(url);
  win.show();

  return {
    close: function() {
      !win.isDestroyed() && win.close();
    },

    addEventListener: function(event, f) {
      let cb;

      switch (event) {
      case "loadstart":
        cb = function() {
          const url = win.isDestroyed()
            ? ""
            : win.webContents.getURL();

          f({url: url});
        };

        listeners.push({
          event: "loadstart",
          f: f,
          remove: function() {
            win.webContents.removeListener("did-finish-load", cb);
          }
        });

        win.webContents.on("did-finish-load", cb);
        break;

      case "loaderror":
        cb = function(event, errorCode, errorDescription, validatedURL) {
          const message = errorDescription
            || "Error when navigating to " + validatedURL;

          f({message: message});
        };

        listeners.push({
          event: "loaderror",
          f: f,
          remove: function() {
            win.webContents.removeListener("did-fail-load", cb);
          }
        });

        win.webContents.on("did-fail-load", cb);
        break;

      case "exit":
        listeners.push({
          event: "exit",
          f: f,
          remove: function() {
            win.removeListener("close", f);
          }
        });

        win.on("close", f);
        break;

      default:
        // do nothing for unknown events
      }
    },

    removeEventListener: function(event, f) {
      if (win.isDestroyed()) {
        listeners = [];
        return;
      }

      listeners = listeners.filter(function(listener) {
        if (listener.event === event && listener.f === f) {
          listener.remove();
          return false;
        }

        return true;
      });
    }
  }
});
