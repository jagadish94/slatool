const { app, Tray, Menu, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const fs = require('fs-extra');
const os = require('os');
const dirPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'input.json')
const configPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/Config/', 'SLAMonitorConfig.json')
const pluginPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/Plugins/', 'SLAMonitorPluginActivate.dll')
const outputFilePath = 'C:/ProgramData/NCR APTRA/SLAMonitorTool/output.json'
const notificationFilePath = 'C:/ProgramData/NCR APTRA/SLAMonitorTool/notificationData.json'
//const keytar = require('keytar')
const Notifications = require('./scripts/notifications')
var filewatcher = require('filewatcher');
const notificationpath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'notificationData.json')
const credPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'cred.json')
let appIcon = null
let win = null
let mainwin = null
const iconPath = path.join(__dirname + '/icons', 'icon2.png')
//
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  //console.log("found");
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  async function ss()
  {
  
    require('./dist/')
    try {
      await electronInstaller.createWindowsInstaller({
        appDirectory: '',
        outputDirectory: '/tmp/build/installer64',
        authors: 'My App Inc.',
        exe: 'myapp.exe'
      });
      console.log('It worked!');
    } catch (e) {
      console.log(`No dice: ${e.message}`);
    }
  }

  app.on('ready', function () {
    app.setAppUserModelId("com.SLATracker.quickstart")
  //  ss();
    CheckDendency();
 
    win = new BrowserWindow({ show: false }).setMenu(null);
    appIcon = new Tray(iconPath);

    //auto launch the app on system startup
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
      args: [
        '--processStart', `SLAMonitorTool`,
        '--process-start-args', `"--hidden"`
      ]
    })


    var contextMenu = new Menu.buildFromTemplate([
      {

        label: 'Track Your SLA here',
        click: () => { openWindow() }
      },
      {
        label: 'Quit',
        click: () => { app.quit() }
      }
    ])
    appIcon.setToolTip("SLA Monitor Tool");
    appIcon.setContextMenu(contextMenu);

  });
}
exports.openWindow = (fileName) => {
  mainwin = new BrowserWindow({
    width: 800, height: 600, icon: iconPath, webPreferences: {
      nodeIntegration: true
    }
  })
  mainwin.setMenuBarVisibility(false)
  // console.log(fileName)
  mainwin.loadFile('views/' + fileName + '.html')

  // Emitted when the window is closed.
  mainwin.on('closed', () => {
    //console.log("called");
    mainwin = null;
  });

}


//filewatcher to notification file
function notify_watcher() {
  var notify = filewatcher();
  notify.add(notificationpath)
  notify.on('change', function (notificationpath, stat) {
    console.log('File modified: %s', notificationpath);
    Notifications()
    if (!stat) console.log('deleted');
  });

}

//copying mandatory files to program data location
function CheckDendency() {
  const configFile = path.join(process.resourcesPath, 'extraResources', 'SLAMonitorConfig.json');
  const pluginFile = path.join(process.resourcesPath, 'extraResources', 'SLAMonitorPluginActivate.dll');
  const notificationFile = path.join(process.resourcesPath, 'extraResources', 'notificationData.json');
  const outputFile = path.join(process.resourcesPath, 'extraResources', 'output.json');

  fs.access(configPath, fs.F_OK, (err) => {
    if (err) {
      DirectoryCopy(configFile, 'C:/ProgramData/NCR APTRA/SLAMonitorTool/Config/SLAMonitorConfig.json');
    }
  })
  fs.access(pluginPath, fs.F_OK, (err) => {
    if (err) {
      DirectoryCopy(pluginFile, 'C:/ProgramData/NCR APTRA/SLAMonitorTool/Plugins/SLAMonitorPluginActivate.dll');
    }
  })
  fs.access(outputFilePath, fs.F_OK, (err) => {
    if (err) {
      copyFile(outputFile, outputFilePath)
    }
  })
  fs.access(notificationFilePath, fs.F_OK, (err) => {

    if (err) {
      // copyFile(notificationFile,notificationFilePath)
      fs.copyFile(notificationFile, notificationFilePath, (err) => {
        if (err) throw err;
        notify_watcher()
      });
    }
    else {
      notify_watcher()
    }
  })

}

function copyFile(source, destination) {
  fs.copyFile(source, destination, (err) => {
    if (err) throw err;

  });

}

function DirectoryCopy(source, destination) {
  // copy source folder to destination
  fs.copy(source, destination, function (err) {
    if (err) {
      return console.error(err)
    }

  });
}


function openWindow() {

  if (win != null) {
    if (win.isMinimized()) {
      //win.restore()
      win.focus()
    }
    //load(win);
  }
  else if (mainwin) {
    if (mainwin.isDestroyed()) {
      mainwin = new BrowserWindow({
        width: 800,
        height: 600,
        icon: iconPath,
        webPreferences: {
          nodeIntegration: true
        }
      })
       mainwin.setMenuBarVisibility(false)
      load(mainwin);
    }
    else if (mainwin.isMinimized()) {
      mainwin.restore()
      mainwin.focus()
    }
  }

  else {
    // Create the browser window.
    win = new BrowserWindow({
      width: 800,
      height: 600,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: true
      }
    })
    win.setMenuBarVisibility(false)
    // Emitted when the window is closed.
    win.on('closed', () => {
      //console.log("called-1");
      win = null;
    });
    load(win);
  }
}

function load(winobj) {
  try {
    var username;
    var password;

    //get crendentials from window credentials-Not using 
    // const credentials= await keytar.findCredentials('SLATool')
    //  if(credentials!=null)
    //  {
    //    username =credentials[0].account;
    //    password =credentials[0].password;
    //  }

    fs.readFile(credPath, "utf-8", (error, data) => {
      if (error) {
        winobj.loadFile('views/index.html')
        return;
      }
      var data = JSON.parse(data);
      if (data.username != null && data.password != null) {
        winobj.loadFile('views/main.html')
      }
      else {
        winobj.loadFile('views/index.html')
      }

    });
  }
  catch{
    winobj.loadFile('views/index.html')
  }
}

exports.handleForm = function handleForm(targetWindow, Username) {
  targetWindow.webContents.send('form-received', Username);
};

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
})

/*app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
*/
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
