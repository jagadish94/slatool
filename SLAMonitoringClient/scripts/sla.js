const { remote, ipcRenderer } = require('electron');
const { handleForm } = remote.require('./main');
const main = remote.require('./main.js')
const currentWindow = remote.getCurrentWindow();
const axios = require('axios').default;
const path = require('path')
const fs = require('fs');
const os = require('os');
const { Notification } = require('electron');
const filewatcher = require('filewatcher');
//const cred=keytar.findCredentials('SLATool')
const submitFormButton = document.querySelector("#ipcForm2");
const responseParagraph = document.getElementById('errorMsg')
const serviceMsg = document.getElementById('serviceMsg')
const Notifications = require('../scripts/notifications')
const credPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'cred.json')
const dirPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'input.json')
const outputPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'output.json')
const notificationpath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'notificationData.json')
var jira_filter;
var dvTable = document.getElementById("dvTable");
const submitButton = document.getElementById('filterSubmit');
var electronOpenLinkInBrowser = require("electron-open-link-in-browser");
//const ipcRenderer = require('electron').ipcRenderer;
const window1 = remote.getCurrentWindow();
var sc = require('windows-service-controller');
var watcher = filewatcher();
var ErrorCode;

//file watcher to output file 
watcher.add(outputPath);
watcher.on('change', function (outputPath, stat) {
    GenerateTable()
    if (!stat) console.log('deleted');
});

onPageLoad();

//Montoring the SLAMonitoring service is running or not continuously
function check_serviceRunning() {
    var status = "not_error";
    serviceMsg.innerHTML = "   "
    return new Promise(resolve => {
        sc.interrogate('SLAMonitoringService')
            .catch(function (error) {
                status = "error";
                var index = error.message.search("does not exist");
                if (index != -1) {
                    submitButton.disabled = true;
                    serviceMsg.innerHTML = "The SLAMonitoringService does not exist as an installed service..please install";
                    //resolve("error")
                }

                else {
                    submitButton.disabled = true;
                    serviceMsg.innerHTML = "The SLAMonitoringService has not been started..to start the service go to start menu->services-> start the service named SLAMonitoringService ";
                    //resolve("error")
                }
            })
            .done(function (result) {
                resolve(status)
                if (status == 'error') {
                    document.getElementById('filterid').disabled = true;
                    // document.getElementById("filterid").value=''
                    submitButton.disabled = true;
                    dvTable.innerHTML = ''
                    responseParagraph.innerHTML = ''
                    document.getElementById("label_SLA").style.display = "none";
                    watcher.remove(outputPath);
                }
                else {
                    document.getElementById('filterid').disabled = false;
                    if (fs.existsSync(dirPath)) {
                        if (ErrorCode) {
                            document.getElementById("label_SLA").style.display = "none";
                            // submitButton.disabled = true;
                        }
                        if (dvTable.innerHTML == "" && !ErrorCode) {
                            responseParagraph.innerHTML = "Please wait... Analysing...";                            submitButton.disabled = true;
                        }
                        if (fs.existsSync(outputPath)) {
                            watcher.add(outputPath);
                        }
                    }
                    else
                        submitButton.disabled = false;
                }
            });
    });
}

//get the latest data from output.json on page load
async function onPageLoad() {
    const status = await check_serviceRunning()
    readOutputFile(status)

}
//check the SLAMonitoring service  is running or not for every 4 seconds 
setInterval(check_serviceRunning, 4000);

//Display the SLA_Results on page load if filterID Exists 
function readOutputFile(status) {
    fs.readFile(dirPath, "utf-8", (error, data) => {
        if (error) {
            return;
        }
        try {
            var data = JSON.parse(data);
            if (data.hasOwnProperty('filterID')) {
                var filterID = data.filterID;
                jira_filter = filterID;
                submitButton.disabled = true;
                document.getElementById("filterid").value = filterID
                //if service is running display the jira Details
                if (status != "error") {
                    if (fs.existsSync(outputPath)) {
                        GenerateTable()
                        responseParagraph.innerHTML = "Please wait... Analysing...";
                    }
                }
            }
        }
        catch{
            submitButton.disabled = false;

        }
    })
}

//store the filterID in file once submitted
submitFormButton.addEventListener("submit", function (event) {
    document.getElementById("label_SLA").style.display = "none";
    event.preventDefault();   // stop the form from submitting
    dvTable.innerHTML = "";
    submitButton.disabled = true;

    responseParagraph.innerHTML = "Please wait... Analysing...";
    let filterID = document.getElementById("filterid").value;
    jira_filter = filterID;
    var data = {
        filterID: filterID
    }
    var data = JSON.stringify(data);

    fs.writeFile(dirPath, data, "utf-8", (error, data) => {

        if (error) {
            return;
        }
        // GenerateTable()    
    });
});

//Restricting the summary length of jira to 12 words 
function shrinkSummary(summary) {
    var words = summary.split(" ");
    var combinewords = "";
    wordlimit = 12;
    word_limit = wordlimit > words.length ? words.length : wordlimit
    for (var i = 0; i < word_limit; i++) {
        combinewords = combinewords + " " + words[i]
    }
    return combinewords
}

//Delete the provided file if present 
function deleteFiles(dirPath) {
    if (fs.existsSync(dirPath)) {
        // Do something

        // Do something
        fs.unlink(dirPath, (err) => {
            if (err) {

            } else {
                console.log('successfully deleted');
            }
        });
    }

}

//write Data to provided file 
function writeFile(dirPath) {

    fs.writeFile(dirPath, ' ', function (err) {
        if (err) return console.log(err);
        //console.log('Hello World > helloworld.txt');
    });
}

//open a jira in new window on click on jiraID 
function newwin(jiraID) {
    require('electron').shell.openExternal('https://jira.ncr.com/browse/' + jiraID);

}

//delete files on logout 
function logout() {
    deleteFiles(credPath)
    deleteFiles(dirPath)
    writeFile(outputPath)
   //deleteFiles(outputPath)
   main.openWindow('index')
   currentWindow.close()

}

//sort jira results from filterID  based on missed-approaching-others.
function sortData(SLA_Result) {
    var missed = [];
    var initial = [];
    var approaching = [];
    for (var i = 0; i < SLA_Result.length; i++) {
        var obj = SLA_Result[i];
        if (obj.SLA_For_Response[0].Action == "missed" || obj.SLA_Update_Frequency[0].Action == "missed" || obj.SLA_Days_To_Resolve[0].Action == "missed") {
            missed.push(obj)
            continue;
        }
        if (obj.SLA_For_Response[0].Action == "Approaching" || obj.SLA_Update_Frequency[0].Action == "Approaching" || obj.SLA_Days_To_Resolve[0].Action == "Approaching") {
            approaching.push(obj)
            continue;
        }

        initial.push(obj)

        // customers.push([obj.JiraID, summary, obj.SLA_For_Response[0].SLA + "_" + obj.SLA_For_Response[0].Action, obj.SLA_Update_Frequency[0].SLA + "_" + obj.SLA_Update_Frequency[0].Action, obj.SLA_Days_To_Resolve[0].SLA + "_" + obj.SLA_Days_To_Resolve[0].Action]);
    }
    sortResult = missed.concat(approaching, initial);
    return sortResult;

}

//Display jiraDetails for provided filterID in table 
function GenerateTable() {
    try {
        var customers = new Array();
        var SLA_Result;
        customers.push(["Jira ID", "Summary", "SLA for Response", "SLA Update Frequency", "SLA Days to Resolve"]);
        fs.readFile(outputPath, "utf-8", (error, data) => {
            if (error) {
                responseParagraph.innerHTML = "Unable to get the jira Info";
                submitButton.disabled = false;
                return;
                //console.error("error: " + error);
            }
            SLA_Result = data;
            var SLA_Result = JSON.parse(SLA_Result);
            if (SLA_Result[0].filterID == jira_filter) {
                responseParagraph.innerHTML = "";
                SLA_Result = SLA_Result[0].SLA_Result;
                if (SLA_Result[0].hasOwnProperty('ErrorCode')) {
                    ErrorCode = SLA_Result[0].ErrorCode;
                    ErrorDescription = SLA_Result[0].ErrorDescription;
                    //console.log(ErrorCode);
                    dvTable.innerHTML = ''
                    if (ErrorCode == "Unauthorized") {
                        deleteFiles(credPath)
                        writeFile(outputPath)
                        //deleteFiles(notificationpath)
                        deleteFiles(dirPath)
                        main.openWindow('index')
                        currentWindow.close()
                        responseParagraph.innerHTML = ErrorDescription;
                    }
                    else
                        responseParagraph.innerHTML = ErrorDescription;

                    submitButton.disabled = false;
                    return;
                }
                SLA_Result = sortData(SLA_Result)
                for (var i = 0; i < SLA_Result.length; i++) {
                    var obj = SLA_Result[i];
                    var summary = shrinkSummary(obj.Summary)
                    var jiraid = "<a href='#' onclick=newwin(" + "'" + obj.JiraID + "'" + ")" + " " + "title=" + "'" + "serverity: " + obj.Severity + "&#10;" + "priority: " + obj.Priority + "'" + ">" + obj.JiraID + "</a>"
                    //  jiraid.setAttribute("onclick","require('shell').openExternal('" + jiraid + "')");
                    customers.push([jiraid, summary, obj.SLA_For_Response[0].SLA + "_" + obj.SLA_For_Response[0].Action, obj.SLA_Update_Frequency[0].SLA + "_" + obj.SLA_Update_Frequency[0].Action, obj.SLA_Days_To_Resolve[0].SLA + "_" + obj.SLA_Days_To_Resolve[0].Action]);
                }

                //Create a HTML Table element.
                var table = document.createElement("TABLE");
                table.border = "1";
                table.style.alignContent = "center";
                //table.style.backgroundColor="white";
                // table.style.borderCollapse = "collapse";

                //Get the count of columns.
                var columnCount = customers[0].length;

                //Add the header row.
                var row = table.insertRow(-1);
                for (var i = 0; i < columnCount; i++) {
                    var headerCell = document.createElement("TH");
                    headerCell.innerHTML = customers[0][i];
                    row.appendChild(headerCell);
                }

                //Add the data rows.
                for (var i = 1; i < customers.length; i++) {
                    row = table.insertRow(-1);
                    for (var j = 0; j < columnCount; j++) {
                        var cell = row.insertCell(-1);
                        var words;
                        if (j == 0 || j == 1) {
                            words = customers[i][j];
                            cell.innerHTML = words;
                        }
                        if (j == 2 || j == 3 || j == 4) {
                            words = customers[i][j].split('_');
                            if (words[1] == "targetMet") {
                                cell.setAttribute("bgcolor", "GREEN")
                            }
                            if (words[1] == "missed") {
                                cell.setAttribute("bgcolor", "red")
                            }
                            if (words[1] == "Approaching") {
                                cell.setAttribute("bgcolor", "ORANGE")
                            }
                            cell.innerHTML = words[0];

                        }

                    }
                }
                if (customers.length >= 1) {
                    ErrorCode = null;
                    document.getElementById("label_SLA").style.display = "block";
                    var red = document.getElementById("myCanvas1");
                    var orange = document.getElementById("myCanvas2");
                    var green = document.getElementById("myCanvas3");


                    var ctx_red = red.getContext("2d");
                    var ctx_orange = orange.getContext("2d");
                    var ctx_green = green.getContext("2d");

                    ctx_red.fillStyle = "red";
                    ctx_red.fillRect(0, 0, red.width, red.height);
                    ctx_orange.fillStyle = "ORANGE";
                    ctx_orange.fillRect(0, 0, orange.width, orange.height);
                    ctx_green.fillStyle = "GREEN";
                    ctx_green.fillRect(0, 0, green.width, green.height);

                }

                // var dvTable = document.getElementById("dvTable");
                //var table = document.getElementById('dvTable');
                dvTable.innerHTML = "";
                dvTable.appendChild(table);
                submitButton.disabled = false;
                responseParagraph.innerHTML = "SLA Data is available.";
            }
        });
        // }
    }
    catch (err) {
        responseParagraph.innerHTML = "Unable to generate result";
        submitButton.disabled = false;

    }
}







