
const path = require('path')
const fs = require('fs');
const os = require('os');


const credPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'cred.json')
const dirPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'input.json')
const outputPath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'output.json')
const notificationpath = path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/', 'notificationData.json')
var jira_filter;


//GenerateTable()

// submitFormButton.addEventListener("submit", function (event) {
//     document.getElementById("label_SLA").style.display = "none";
//     event.preventDefault();   // stop the form from submitting
//     dvTable.innerHTML = "";
//     submitButton.disabled = true;
//     responseParagraph.innerHTML = "Please wait... Analysing...";
//     let filterID = document.getElementById("filterid").value;
//     jira_filter = filterID;
//     var data = {
//         filterID: filterID
//     }
//     var data = JSON.stringify(data);

//     fs.writeFile(dirPath, data, "utf-8", (error, data) => {

//         if (error) {
//             console.error("error: " + error);
//             return;
//         }
//         // GenerateTable()    
//     });
// }); var data = JSON.parse(data);
//notification()

shrinkSummary();

function shrinkSummary() {
    summary='TEST JIRA2_to test SLA Monitor Tool'
    var words = summary.split(" ");
    var combinewords = "";
    wordlimit = 12;
    word_limit = wordlimit > words.length ? words.length : wordlimit
    for (var i = 0; i < word_limit; i++) {
        combinewords = combinewords + " " + words[i]
    }
    return combinewords

}

function notification()
{
    var missed;
    var Approaching_Jiras;
    fs.readFile(notificationpath, "utf-8", (error, data) => {
        if (error) {
            responseParagraph.innerHTML = "Unable to get the jira Info";
           // submitButton.disabled = false;
            return;
            //console.error("error: " + error);
        }
        var data = JSON.parse(data);
        console.log(data)
        var missedJira = data[0].Missed_Jiras
        var missJira = "";
        
        missedJira.forEach(element => {
            if (missJira) {
                missJira = missJira + ", " + element;
            }
            else
            missJira = element
    
          });
           missed="missedJiras-"+missJira
          console.log(missed)
          var actionJira = "";
          Approaching_Jiras = data[0].Approaching_Jiras
          Approaching_Jiras.forEach(element => {
              if (actionJira) {
                actionJira = actionJira + ", " + element;
              }
              else
                actionJira = element
      
            });
            var approaching="approachingJiras- "+actionJira
            console.log(approaching)
          //  totalData=missed '\n' +approaching
            console.log(totalData)

        });
      
        
        actionJira ='AE-13639\nAE-1854'
        console.log(actionJira)
        
      
     
}





function deleteFiles(dirPath) {
    if (fs.existsSync(dirPath)) {
        // Do something

        // Do something
        fs.unlink(dirPath, (err) => {
            if (err) {
                console.log("failed to delete local image:" + err);
            } else {
                console.log('successfully deleted local image');
            }
        });
    }

}


function writeFile(dirPath) {

    fs.writeFile(dirPath, ' ', function (err) {
        if (err) return console.log(err);
        //console.log('Hello World > helloworld.txt');
    });
}

function sortData(SLA_Result)
{
    console.log(typeof SLA_Result)
    console.log(SLA_Result)
    var missed=[];
    var initial=[];
    var approaching=[];
    for (var i = 0; i < SLA_Result.length; i++) {
        var obj = SLA_Result[i];
        //var summary = shrinkSummary(obj.Summary)
        if(obj.SLA_For_Response[0].Action =="missed"|| obj.SLA_Update_Frequency[0].Action=="missed" || obj.SLA_Days_To_Resolve[0].Action=="missed")
        {
            missed.push(obj)
            continue;
        }
        if(obj.SLA_For_Response[0].Action =="Approaching"|| obj.SLA_Update_Frequency[0].Action=="Approaching" || obj.SLA_Days_To_Resolve[0].Action=="Approaching")
        {
            approaching.push(obj)
            continue;
        }

        initial.push(obj)

       // customers.push([obj.JiraID, summary, obj.SLA_For_Response[0].SLA + "_" + obj.SLA_For_Response[0].Action, obj.SLA_Update_Frequency[0].SLA + "_" + obj.SLA_Update_Frequency[0].Action, obj.SLA_Days_To_Resolve[0].SLA + "_" + obj.SLA_Days_To_Resolve[0].Action]);
    }
    console.log(missed)
    console.log(approaching)
    console.log(initial)

    sortResult = missed.concat(approaching,initial); 
    return sortResult;
     
}

function GenerateTable() {
    try {
        //console.log("generateTable")
        var customers = new Array();
        var SLA_Result;
        customers.push(["Jira ID", "Summary", "SLA for Response", "SLA Update Frequency", "SLA Days to Resolve"]);
        fs.readFile(outputPath, "utf-8", (error, data) => {
            if (error) {
                responseParagraph.innerHTML = "Unable to get the jira Info";
               // submitButton.disabled = false;
                return;
                //console.error("error: " + error);
            }
            SLA_Result = data;
            var SLA_Result = JSON.parse(SLA_Result);
            console.log(SLA_Result)
            console.log(SLA_Result[0].filterID)
            //console.log(jira_filter)
            SLA_Result = SLA_Result[0].SLA_Result;
            SLA_Result=sortData(SLA_Result)
            for (var i = 0; i < SLA_Result.length; i++) {
                var obj = SLA_Result[i];
                var summary = shrinkSummary(obj.Summary)
                customers.push([obj.JiraID, summary, obj.SLA_For_Response[0].SLA + "_" + obj.SLA_For_Response[0].Action, obj.SLA_Update_Frequency[0].SLA + "_" + obj.SLA_Update_Frequency[0].Action, obj.SLA_Days_To_Resolve[0].SLA + "_" + obj.SLA_Days_To_Resolve[0].Action]);
            }
            if (SLA_Result[0].filterID == jira_filter) {
                responseParagraph.innerHTML = "";
                SLA_Result = SLA_Result[0].SLA_Result;
                sortData(SLA_Result)
                if (SLA_Result[0].hasOwnProperty('ErrorCode')) {
                    var ErrorCode = SLA_Result[0].ErrorCode;
                    console.log(ErrorCode);
                    if (ErrorCode == "BadRequest")
                        responseParagraph.innerHTML = "The given filterID is not valid.";
                    else if (ErrorCode == "GatewayTimeout")
                        responseParagraph.innerHTML = "Unable to connect to the Server.";
                    else if (ErrorCode == "Unauthorized") {
                        deleteFiles(credPath)
                        writeFile(outputPath)
                        //deleteFiles(notificationpath)
                        deleteFiles(dirPath)

                        main.openWindow('index')
                        currentWindow.close()
                        responseParagraph.innerHTML = "The given username or password is not correct";
                    }
                    else if (ErrorCode == "SLA")
                        responseParagraph.innerHTML = "Unable to calculate SLA Time";
                    else
                        responseParagraph.innerHTML = "Internal server error";

                  //  submitButton.disabled = false;
                    return;
                }
                
               
                for (var i = 0; i < SLA_Result.length; i++) {
                    var obj = SLA_Result[i];
                    var summary = shrinkSummary(obj.Summary)
                    customers.push([obj.JiraID, summary, obj.SLA_For_Response[0].SLA + "_" + obj.SLA_For_Response[0].Action, obj.SLA_Update_Frequency[0].SLA + "_" + obj.SLA_Update_Frequency[0].Action, obj.SLA_Days_To_Resolve[0].SLA + "_" + obj.SLA_Days_To_Resolve[0].Action]);
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
                        const words = customers[i][j].split('_');
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
                if (customers.length >= 1) {
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

                var dvTable = document.getElementById("dvTable");
                //var table = document.getElementById('dvTable');
                dvTable.innerHTML = "";
                dvTable.appendChild(table);
                //submitButton.disabled = false;
                responseParagraph.innerHTML = "SLA Data is available.";
            }
        });
        // }
    }
    catch (err) {
        responseParagraph.innerHTML = "Unable to generate result";
        //submitButton.disabled = false;

    }
}







