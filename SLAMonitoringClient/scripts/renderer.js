const { remote, ipcRenderer, Notification } = require('electron');
const { handleForm } = remote.require('./main');
const main = remote.require('./main.js')
const currentWindow = remote.getCurrentWindow();
const axios = require('axios').default;
const fs = require('fs');
const path=require('path')
const keytar = require('keytar')
const submitFormButton = document.querySelector("#ipcForm2");
const responseParagraph = document.getElementById('response')

const dirPath=path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/','input.json')

submitFormButton.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the form from submitting

  const submitButton=document.getElementById('sign-in');
  submitButton.disabled=true;
  submitButton.value="Please wait...";

  let Username = document.getElementById("username").value;
  let Password = document.getElementById("password").value;
  
  // saving the details in windows credentials 

  var baseURL = 'http://jira.ncr.com'
  var Jira_id = 'ACTCORE-25536'
  const auth = {
    username: Username,
    password: Password
  }
 
  var myJSON = JSON.stringify(auth);

  axios.get(`${baseURL}/rest/api/2/issue/${Jira_id}`,
    {
      auth: auth,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      timeout:5000
    }).then((response) => {
      keytar.setPassword('SLATool', Username, Password);
      console.log(response.data)
      main.openWindow('main')
      currentWindow.close()
    }).catch((error) => {
      console.log(error);
      submitButton.disabled=false;
      submitButton.value="Sign in";
      
      handleForm(currentWindow, "Sorry, your username and password are incorrect");
    });
});

ipcRenderer.on('form-received', function (event, args) {
  responseParagraph.innerHTML = args
  console.log('args:', args);
});

