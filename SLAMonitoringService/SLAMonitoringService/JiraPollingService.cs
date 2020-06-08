using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Tulpep.NotificationWindow;
using SLAMonitoringServiceCore;

namespace SLAMonitoringService
{
    class JiraPollingService
    {
        private string baseURL = "http://jira.ncr.com";

        ISLAMonitoringService sLA_Calculation;
        ParseJsonResponse parseJsonResponse = new ParseJsonResponse();
        private string username = "";
        private string password = "";
        private string filterID = "";

        private string jsonFilePath = @"C:\ProgramData\NCR APTRA\SLAMonitorTool\input.json";

        public JiraPollingService()
        {    
            // TBD: Pick the product name from app.config file.
            sLA_Calculation = GetPlugin("Activate");
        }

        ISLAMonitoringService GetPlugin(string productName)
        {
            //TBD: Fetch the dll from Plugins folder. Loop through all the dlls and pick up
            // the dll whose attribute matches the supplied product name.
            return null;
        }

        public void GetJsonFileData()
        {
            try
            {              
                
                if (System.IO.File.Exists(jsonFilePath))
                {
                    string json = File.ReadAllText(jsonFilePath);
                    JObject data = JObject.Parse(json);
                    username = (string)data["username"];
                    password = (string)data["password"];
                    filterID = (string)data["filterID"];
                    JiraRequest(filterID, username, password);
                }
                else
                    return;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
                return;
            }
        }

        /// <summary>
        /// JiraRequest
        /// </summary>
        /// <param name="filterID"></param>
        /// <param name="username"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        private string JiraRequest(string filterID, string username, string password)
        {
            try
            {
                List<Summary> resultParse = new List<Summary>();
                string url = "/rest/api/2/search?";
                
                var response = "";
                string jqlQuery = "jql = filter = " + filterID + " & maxResults = 5000 & expand = changelog";
                var client = new System.Net.Http.HttpClient();
                string base64Credentials = GetEncodedCredentials();
                var header = new AuthenticationHeaderValue("Basic", base64Credentials);
                client.DefaultRequestHeaders.Authorization = header;

                string ClientURL = baseURL + url + jqlQuery.Replace(" ", "");

                var result = client.GetAsync(ClientURL).Result;
                //var result = client.GetAsync("http://jira.ncr.com/rest/api/2/search?jql=filter=143308&maxResults=3&expand=changelog").Result;
                //var result = client.GetAsync("http://jira.ncr.com/rest/api/2/search?jql=issue=ACTCORE-26489&expand=changelog").Result;

                if (result.StatusCode == HttpStatusCode.OK)
                {
                    response = result.Content.ReadAsStringAsync().Result;
                    resultParse = parseJsonResponse.ParseRespose(response);
                    if (resultParse != null)
                        sLA_Calculation.PublishSLAInfo(resultParse.ToArray());
                }
                return response;
            }
            catch (System.Net.WebException ex)
            {
                sLA_Calculation.ReportFailure("", ex.Message);
                Console.WriteLine("Exception Occurred" + " : {0}", ex.Message);
                return "";
            }
        }

        /// <summary>
        /// GetEncodedCredentials
        /// </summary>
        /// <returns></returns>
        private string GetEncodedCredentials()
        {
            string mergedCredentials = string.Format("{0}:{1}", username, password);
            byte[] byteCredentials = UTF8Encoding.UTF8.GetBytes(mergedCredentials);
            return Convert.ToBase64String(byteCredentials);
        }
    }
}



