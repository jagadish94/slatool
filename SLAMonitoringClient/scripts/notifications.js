const fs = require('fs');
const path = require('path');
const { BrowserWindow } = require('electron');
const { copySync } = require('fs-extra');

const notificationpath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'notificationData.json')
function notifyData(data)
{
  var totalData='';
  var data = JSON.parse(data);
  console.log(data)
  var missJira = "";
  var actionJira = "";
  var missedJiras = data[0].SLA_Missed
  var miss_length=missedJiras.length;

  if(miss_length>=4)
  {
    missedJiras=missedJiras.slice(0,3)
    if((missedJiras[1].length+missedJiras[2].length) >= 27)
    {
      missedJiras=missedJiras.slice(0,2)
    }
    else
    {
     missedJiras=missedJiras.slice(0,3)
    }

  }
  missedJiras.forEach(element => {
      if (missJira) {
          missJira = missJira + ", " + element;
      }
      else
      missJira = element

    });
    if(miss_length>=4)
    {
      missJira=missJira+".."
    }

    var missed= miss_length+" SLA Missed-"+missJira
  

    var Approaching_Jiras = data[0].SLA_Approaching
    var Approaching_length=Approaching_Jiras.length;
    if(Approaching_Jiras.length>=4)
    {
    
      if((Approaching_Jiras[1].length +Approaching_Jiras[2].length) >= 27)
      {
        
        Approaching_Jiras=Approaching_Jiras.slice(0,2)
      }
      else
      {
        Approaching_Jiras=Approaching_Jiras.slice(0,3)
     }
      Approaching_Jiras=Approaching_Jiras.slice(0,3)
    }
  
    Approaching_Jiras.forEach(element => {
        if (actionJira) {
          actionJira = actionJira + ", " + element;
        }
        else
          actionJira = element

      });

      if(Approaching_length>=4)
      {

        actionJira= actionJira+".."
      }

      var approaching=Approaching_length+" SLA Approching-"+actionJira
      console.log(approaching)
      if(actionJira)
      {
        totalData=approaching; 
      }
      
      if(missJira)
      {
        totalData=missed;
      }
  
      if(actionJira&&missJira)
      {
        totalData=missed +'\t\r' +approaching;
  
      }
      
      return totalData;
     

    }
  


function getNotified() {
  fs.readFile(notificationpath, "utf-8", (error, data) => {
    if (error) {
      console.log(error)
      return;
    }
    try {
 
     const WindowsBalloon = require('node-notifier').WindowsBalloon;
      var notifier = new WindowsBalloon({
        withFallback: false, // Try Windows Toast and Growl first?
        // customPath: undefined // Relative/Absolute path if you want to use your fork of notifu
      });
   
      const notificationData = {
        title: 'SLA Alert',
        message:'hkk',

      }
     // actionJira = "<h2>line2line4line6line7line8line9line10line11\t\rline3lone1l1line4line9line2line2line1line3";      
      var actionJira= notifyData(data);//

   
notificationData.message=actionJira;
      notifier.notify({
        icon: path.join(__dirname, '../icons/notification.jpg'),
        appName: "com.SLATracker.quickstart",
        title: notificationData.title,
        message: notificationData.message,
        sound: true,
        wait: true,
       // time : 20000
       // timeout: 20,
         install: "com.SLATracker.quickstart",
      },
        function (err, response) {

          // Response is response from notification
         // console.log("notificationClicked")
        });
        
      notifier.on('click', function (notifierObject, options, event) {
        // Triggers if `wait: true` and user clicks notification
        // Create the browser window.
        if (!win) {
          var win = new BrowserWindow({
            width: 800,
            height: 600,
            webSecurity: false,
            //icon:iconPath,
            webPreferences: {
              nodeIntegration: true
            }
          })
        }
        win.loadFile('views/notification.html')
        // currentWindow.close()
       
      });
     

    }
    catch{
      console.log("error")
    }

  })
  //
}

module.exports = getNotified;