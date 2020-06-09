const { app,Tray,Menu, BrowserWindow,ipcMain,Notification } = require('electron')
const path=require('path')
const fs = require('fs');
const os = require('os');

const dirPath=path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/','input.json')
const iconPath=path.join(__dirname +'/icons','icon2.png')
const keytar = require('keytar')

let appIcon=null
let win =null

app.on('ready',function(){
  win=new BrowserWindow({show:false}).setMenu(null);
  appIcon=new Tray(iconPath);
  var contextMenu=new Menu.buildFromTemplate([
    {
      label:'Track Your SLA here',
      click: () =>{openWindow()}
    },
    {
      label: 'Quit',
      click: () => { app.quit() }
    }
  ])
appIcon.setToolTip("SLA Monitor Tool");
appIcon.setContextMenu(contextMenu);

});

async function openWindow()
{
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon:iconPath,
    webPreferences: {
      nodeIntegration: true
    }
  })
  try{
      var username;
      var password;
      //get crendentials from window credentials 
      const credentials= await keytar.findCredentials('SLATool')
      if(credentials!=null)
      {
        username =credentials[0].account;
        password =credentials[0].password;
        const auth = {
            username: username,
            password: password
        }
       
        if(username!=null && password!=null)
        {
          win.loadFile('views/main.html')
        }
        else{
          win.loadFile('views/index.html')
        }
    }
  }
  catch{

       win.loadFile('views/index.html')
  }


}
exports.openWindow=(fileName) =>{
  let win =new BrowserWindow({width:800,height:600,icon: iconPath,webPreferences: {
    nodeIntegration: true
  }})
  win.loadFile('views/'+fileName+'.html')
   // Open the DevTools.
  win.webContents.openDevTools();
  

}

exports.handleForm = function handleForm(targetWindow, Username) {
  console.log("this is the Username from the form ->", Username)
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
