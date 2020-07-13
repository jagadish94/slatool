const { remote, ipcRenderer, Notification } = require('electron');
const { handleForm } = remote.require('./main');
const main = remote.require('./main.js')
const currentWindow = remote.getCurrentWindow();
const axios = require('axios').default;
const fs = require('fs');
const fs1 = require('fs-extra');
const path = require('path')
//const keytar = require('keytar')
const submitFormButton = document.querySelector("#ipcForm2");
const responseParagraph = document.getElementById('response')
var crypto = require('crypto')
const dirPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'input.json')
const credPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'cred.json')
const configPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/Config/', 'SLAMonitorConfig.json')
const outputPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'output.json')
const electronInstaller = require('electron-winstaller');


function DirectoryCopy(source, destination) {
  // copy source folder to destination
  fs1.copy(source, destination, function (err) {
    if (err) {
      console.log('An error occured while copying the folder.')
      return console.error(err)
    }
    //  console.log('Copy completed!')
  });
}

//store the username and pasword if vaild and redirect to another page
submitFormButton.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the form from submitting
  DirectoryCopy('Config/', 'C:/ProgramData/NCR APTRA/SLAMonitorTool/Config');
  const submitButton = document.getElementById('sign-in');
  submitButton.disabled = true;
  submitButton.value = "Please wait...";

  let Username = document.getElementById("username").value;
  let Password = document.getElementById("password").value;

  var baseURL = 'http://jira.ncr.com'
  var Jira_id = 'ACTCORE-25536'
  const auth = {
    username: Username,
    password: Password
  }

  var myJSON = JSON.stringify(auth);
  //verify the username and password are valid or not
  axios.get(`${baseURL}/rest/api/2/issue/${Jira_id}`,
    {
      auth: auth,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      timeout: 10000
    }).then((response) => {
      //  keytar.setPassword('SLATool', Username, Password);
      var password = encryptCred(Password)
      const cred = {
        username: Username,
        password: password
      }
      var myJSON = JSON.stringify(cred);


      fs.writeFile(credPath, myJSON, "utf-8", (error, data) => {
        if (error) {
          console.error("error: " + error);
          return;
        }
        //Removing the contents inside output file once logout is performed or about to login
        fs.writeFile(outputPath, ' ', function (err) {
          if (err) return console.log(err);
          //console.log('Hello World > helloworld.txt');
          main.openWindow('main')
          currentWindow.close()
      });
       
      });


    }).catch((error) => {
      console.log(error);
      submitButton.disabled = false;
      submitButton.value = "Sign in";
      handleForm(currentWindow, "Unable to Login");
    });
});

//encrypt the password
function encryptCred(password) {
  var algorithm = 'aes-256-cbc';
  var passkey = "mypassword";
  var password = password;
  var crypto = require('crypto')
  var mykey = crypto.createCipher(algorithm, passkey);
  var mystr = mykey.update(password, 'utf8', 'base64')
  mystr += mykey.final('base64');
  return mystr;
}

ipcRenderer.on('form-received', function (event, args) {
  responseParagraph.innerHTML = args
  console.log('args:', args);
});

