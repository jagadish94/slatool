const { remote, ipcRenderer } = require('electron');
const { handleForm} = remote.require('./main');
const main=remote.require('./main.js')
const currentWindow = remote.getCurrentWindow();
const axios = require('axios').default;
const path=require('path')
const fs = require('fs');
const os = require('os');
const {Notification} = require('electron');
const keytar = require('keytar')


const cred=keytar.findCredentials('SLATool')
const submitFormButton = document.querySelector("#ipcForm2");
const responseParagraph = document.getElementById('errorMsg')

const dirPath=path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/','input.json')
const outputPath=path.join('C:/ProgramData/NCR APTRA/SLAMonitorTool/','SLA_Details.json')

var dvTable = document.getElementById("dvTable");
const submitButton=document.getElementById('filterSubmit');

async function jiraAPI(filterID){

    //const result = await fetchTheData(someUrl, value);
    var credentials;
    var username;
    var password;
    const cred= await keytar.findCredentials('SLATool')

    credentials = JSON.stringify(cred);  
 
    credentials= JSON.parse(credentials);

    username =credentials[0].account;
    password =credentials[0].password;
    const auth = {
        username: username,
        password: password
    }
    jiraapiRequest(filterID,auth)
   // return result;
}




function jiraapiRequest(filterID,auth)
{
    maxResults=1000;
    var baseURL = 'http://jira.ncr.com'
    //console.log(auth)
    axios.get(`${baseURL}/rest/api/2/search?jql=filter=${filterID}&maxResults=${maxResults}&expand=${'changelog'}`,
    {
        auth: auth,
        headers: {
            "Content-Type": "multipart/form-data",
            "X-Atlassian-Token": "no-check"
        },
        timeout:30000
    }).then((response) => {
        try{
        console.log(response.data)
        var jiraInfo=getJiraDetails(response.data)
        calucateSLA(jiraInfo)
        submitButton.disabled=false;
        }
        catch(err){
            submitButton.disabled=false;
            responseParagraph.innerHTML="Error! No data available";
        }
    }).catch((error) => {
        //console.log(error.response.status);
        submitButton.disabled=false;
        responseParagraph.innerHTML="Error! No data available";
    });
}


fs.readFile(dirPath, "utf-8", (error, data) => {
    if(error)
    {
        console.log(error)
        return;
    }

    try
    {  
       // keytar.setPassword('KeytarTest', 'jp185318', 'J@ggu@321');
         var data= JSON.parse(data);
        if(data.hasOwnProperty('filterID')){
            var filterID=data.filterID;
            submitButton.disabled=true;
            document.getElementById("filterid").value=filterID
            console.log(filterID); 
            jiraAPI(filterID)

        }
    }
    catch{
        console.log("error")
    }
   



})
submitFormButton.addEventListener("submit", function (event) {
    document.getElementById("label_SLA").style.display = "none";
    event.preventDefault();   // stop the form from submitting
    
    dvTable.innerHTML = "";
    submitButton.disabled=true;
    responseParagraph.innerHTML="Please wait... Analysing...";

    let filterID = document.getElementById("filterid").value;
    var baseURL = 'http://jira.ncr.com'
    console.log(baseURL)
    var maxResults = 5000
 
    var cred_Data="data";
    var username;
    var password;

     var  data={
          filterID: filterID
      }
      var data = JSON.stringify(data);
  
        fs.writeFile(dirPath, data, "utf-8", (error, data) => {
       
         if (error){
             console.error("error: " + error);
             return;
         }
            console.log("data: " + data);
            jiraAPI(filterID)
        
       });
    });
 

    //console.log(auth.username)




function getJiraDetails(response)
{
    console.log(response)
    console.log(response.issues)
    var filterDetails=[]
    response.issues.forEach(function(issue){
    var now = new Date(issue.fields.created);
    var now2= new Date(issue.fields.updated);
    const diffTime = Math.abs(now2 - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    console.log(diffTime + " milliseconds");
    console.log(diffDays + " days");
   //   var n = diffDays.getSeconds(); 
   //   console.log(diffDays.getSeconds())
  //  var time=now.format("dd/MM/yyyy hh:mm TT");
  //let strFormattedNew = strftime(, '%Y-%m-%dT%H:%M:%S.000%z');
  var summary = issue.fields.summary;
  
  var jiraDetails={
     jiraId :  issue.key,
     severity: issue.fields.customfield_10243.value,
     priority:issue.fields.priority.name,
     summary:issue.fields.summary,
     SLA_Triage:issue.fields.customfield_14135,
     SLA_resolved:issue.fields.customfield_11630,
     SLA_verified : issue.fields.customfield_11631,
     SLA_Done:issue.fields.customfield_11632,
     assignee:issue.fields.assignee.displayName,
     Reporter:issue.fields.reporter.displayName,
     issuetype:issue.fields.issuetype.name,
     createddate : issue.fields.created,
     status : issue.fields.status.name,
     customer :issue.fields.customfield_100400 ? str(issue.fields.customfield_10040[0].value) : "None",
     updateddate:issue.fields.updated,
     history :issue.changelog.histories,   
    }  
    filterDetails.push(jiraDetails)
  //  console.log(jiraDetails)
     
  });
   jiraInfo = JSON.stringify(filterDetails);  
   return jiraInfo;
}

function calucateSLA(data){
    //code block to be executed
    var jira_Details = JSON.parse(data);
    console.log(jira_Details.length)
    var filter_SLA_Detais=[]
    for (var i=0; i< jira_Details.length;i++)
    { 
        var issue= jira_Details[i]; 
        var jiraId=issue.jiraId;
        var summary = issue.summary;
        var  createddate = new Date(issue.createddate);
        var  updateddate = new Date(issue.updateddate);
        var now = new Date();   
        var  diff_seconds = Math.abs(now - createddate)/1000;
        var  severity =issue.severity;
        var history = issue.history;
        var SLA_resolved=issue.SLA_resolved;
        diffMillSec=0;
        var TODate=null;
        var onHoldto=false;
        var onHoldTime=0;
        var onHoldfrom= false;
        var customerLastUpdate_Sec=null;
        history.forEach(history => 
        {    
            history.items.forEach((item)=>{
            if (item.field == 'status')
            {
                console.log( 'Date:' + history.created + ' From:' + item.fromString + ' To:' + item.toString)
            }
            if(item.toString=="On Hold")
            {
                 TODate = new Date(history.created);
                 onHoldto=true;
            }
            if(item.fromString=="On Hold")
            {
                var FromDate = new Date(history.created);
                const diffTimeInSec = Math.abs(TODate - FromDate)/1000;

               //  diffMillSec = diffMillSec + Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                 onHoldfrom=true;            
            }
            
            //if the jira does not have customers next steps field
            //customerupdatefield = customerupdatefield ? customerupdatefield : updateddate
            if(item.field=="Customer Facing Next Steps" )
            {
            console.log( 'Date:' + history.created + ' From:' + item.fromString + ' To:' + item.toString)
            var  customerupdatefield = new Date(history.created);
            //  console.log(customerupdatefield)
            var now = new Date();   
              customerLastUpdate_Sec = Math.abs(now - customerupdatefield)/1000;
            //  console.log("diff_seconds"+ diff_seconds)
            }

            });
            if(onHoldfrom == false && onHoldto == true)
            {
                var now = new Date();
                onHoldTime = Math.abs(TODate - now)/1000;
                //const diffMillSec = diffMillSec + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 
            }

        });
         
       var SLA_ResponseTime= getSLA_Response(issue,severity,diff_seconds)
       console.log(SLA_ResponseTime)
       var SLAResolveTime=getSLA_Resolve(severity,SLA_resolved,issue.status)
       console.log(SLAResolveTime)
       var UpdatefreqTime=getUpdatefrequency(severity,customerLastUpdate_Sec,createddate,now)
       console.log(UpdatefreqTime)
        console.log(SLA_ResponseTime.SLA_Response)
        var SLA_Details={
            jiraId: jiraId,
            summary :summary,
            SLA_Response: {
                SLA_ResponseTime: SLA_ResponseTime.SLA_Response,
                SLA_ResponseAction : SLA_ResponseTime.Action
            },
            SLA_Frequency :{
                SLA_FrequencyTime:  UpdatefreqTime.SLA_Frequency,
                SLA_FrequencyAction : UpdatefreqTime.Action
            },
            SLA_Resolve : {
                SLA_ResolveTime: SLAResolveTime.SLA_Resolve,
                SLA_ResolveAction : SLAResolveTime.Action
            }
        }
        console.log(SLA_Details)

        filter_SLA_Detais.push(SLA_Details)
    }
    var filter_SLA_Detais = JSON.stringify(filter_SLA_Detais);  
    console.log(filter_SLA_Detais)
   fs.writeFile(outputPath, filter_SLA_Detais, "utf-8", (error, data) => {
    GenerateTable()
       if (error){
           console.error("error: " + error);
       }
   });
}
 
function getSLA_Response(issue,severity,diff_seconds)
{ 
    var Action;
    if (severity == "S1")
        limit = 1
    else if (severity == "S2")
        limit = 3
    else if (severity == "S3")
        limit = 7
    else
        limit = 14
  
    if  (issue.status  == "Not Started"){ 
        SLA_ResponseTotalTime = ((limit * 24) - (diff_seconds / 3600))/24;
        // SLA_Response = Math.round((SLA_Response*10)/10,1)
        // console.log()
        SLA_Response = SLA_ResponseTotalTime.toFixed(2); 
        if(SLA_Response > 0 )
        {
            if(((SLA_Response*100)/limit)<= 40)
            {
                Action="Approaching"
            }
            else
                Action="initial"
        }
        else
        {         
            Action = "missed"
        }

           
    }
    else{
        SLA_Response =issue.SLA_Triage.toFixed(2);

        if(SLA_Response <  limit)
        {
            Action="targetMet"

        }
        if(SLA_Response > limit )
        {    
          SLA_Response=limit-SLA_Response 
          SLA_Response = SLA_Response.toFixed(2);

          Action = "missed"

        }

    }
    var SLA_ResponseData=
    {
        SLA_Response: SLA_Response,
        Action : Action 
    }

   // SLA_ResponseData=JSON.stringify(SLA_ResponseData)
    return SLA_ResponseData;
}
function getSLA_Resolve(severity,SLA_resolved,status){
    if (severity == "S1")
        limit = 3
    else if (severity == "S2")
        limit = 15
    else if (severity == "S3")
        limit = 30
    else
        limit = 90
        //var onHoldTime=onHoldTime/3600;
        //SLA_Resolve = ((limit * 24) - (diff_seconds / 3600))/24
        SLA_Resolve=  limit-SLA_resolved;
            
    if(SLA_Resolve > 0) 
    {
        if(status=="Ready for QA" || status == "In QA" || status=="Done" || status=="Ready for Done")
        {
            Action="targetMet"
        }

        else{
            console.log((SLA_Resolve*100)/limit)
            if(((SLA_Resolve*100)/limit)<= 40)
            {
            Action="Approaching"
            }
            else{
                Action = "initial";
            }

        }
    }
    else
     Action = "missed"

    SLA_Resolve = SLA_Resolve.toFixed(2);   
    var SLA_ResolveData=
    {
        SLA_Resolve: SLA_Resolve,
        Action : Action 

    }
    return SLA_ResolveData;
}
function getUpdatefrequency(severity,customerLastUpdate_Sec,createddate,now)
{
       
    if (severity == "S1")
    limit = 1
    else if (severity == "S2")
    limit = 7
    else if (severity == "S3")
    limit = 14
    else
    limit = 30

    customerLastUpdate_Sec = customerLastUpdate_Sec ? customerLastUpdate_Sec :  customerLastUpdate_Sec = Math.abs(now -createddate )/1000;

    SLA_Frequency = (limit * 24) - (customerLastUpdate_Sec / 3600)
    SLA_Frequency = SLA_Frequency/24
    if (SLA_Resolve < SLA_Frequency || SLA_Resolve <= 0)
    {      
        SLA_Frequency = SLA_Resolve;
    }
    else{

        SLA_Frequency = SLA_Frequency.toFixed(2);
    }

    if (SLA_Frequency > 0)
    {
        console.log((SLA_Frequency*100)/limit)
        if(((SLA_Frequency*100)/limit) <= 40)
        {
           Action="Approaching"
        }
        else{
            Action = "initial";
        }
       
    }
    else
    {
        Action = "missed";
    }
    
    var SLA_FrequencyData=
    {

        SLA_Frequency: SLA_Frequency,
         Action : Action 

    }
    return SLA_FrequencyData;
}

function summaryLen(summary)
{
    // var str = "Activate SPL ACTCORE-26454 TRUIST-2.5.3.32.9 - SDM2 - Mixed Media - Infeed jam";
    // var str2="hello this is the my room"
    var words = summary.split(" ");
    console.log(words)
    var  combinewords="";
    wordlimit=12;
    console.log(words.length)
    word_limit=wordlimit > words.length ? words.length  : wordlimit
    for (var i = 0; i <word_limit; i++) {
       combinewords =combinewords +" "+words[i]
      // console.log(combinewords)
    }
     return combinewords
    //console.log(words);

}

function GenerateTable() {
    console.log("Build an array containing Customer records.");
    var customers = new Array();
    var SLA_Result;
    customers.push(["Jira ID", "Summary", "SLA for Response","SLA Update Frequecy","SLA Days to Resolve"]);
    fs.readFile(outputPath, "utf-8", (error, data) => {
        // console.log(data)
        SLA_Result=data;
        console.log(SLA_Result)
        var SLA_Result = JSON.parse(SLA_Result);
        for(var i = 0; i < SLA_Result.length; i++) {
            var obj = SLA_Result[i];
            console.log(obj)
            var summary =summaryLen(obj.summary)
            customers.push([obj.jiraId,summary,obj.SLA_Response.SLA_ResponseTime+"_"+obj.SLA_Response.SLA_ResponseAction,obj.SLA_Frequency.SLA_FrequencyTime+"_"+obj.SLA_Frequency.SLA_FrequencyAction,obj.SLA_Resolve.SLA_ResolveTime+"_"+obj.SLA_Resolve.SLA_ResolveAction]);
        }
        
    
        //Create a HTML Table element.
        var table = document.createElement("TABLE");
        table.border = "1";
        table.style.alignContent="center";
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
                console.log(cell)
                const words = customers[i][j].split('_');
                console.log(words[0]);
               if(words[1]=="targetMet")
               {
                cell.setAttribute("bgcolor", "GREEN")
               }
               if(words[1]=="missed")
               {
                cell.setAttribute("bgcolor", "red")
               }
            //    if(words[1]=="initial")
            //    {
            //     cell.setAttribute("bgcolor", "ORANGE")
            //    }
               if(words[1]=="Approaching")
               {
                cell.setAttribute("bgcolor", "ORANGE")
               }
                console.log(cell)
                
                cell.innerHTML = words[0];
            
                console.log(cell.innerHTML)
                //cell.style.backgroundColor="red";
            }
        }
        if(customers.length>=1)
        {
            document.getElementById("label_SLA").style.display = "block";
            var red = document.getElementById("myCanvas1");
            var orange= document.getElementById("myCanvas2");
            var green= document.getElementById("myCanvas3");


             var ctx_red = red.getContext("2d");
             var ctx_orange = orange.getContext("2d");
             var ctx_green= green.getContext("2d");

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
        submitButton.disabled=false;
        responseParagraph.innerHTML="SLA Data is available.";
  
         if (error){
             console.error("error: " + error);
         }
       });

}



