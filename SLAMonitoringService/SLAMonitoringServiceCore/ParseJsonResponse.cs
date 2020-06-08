using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SLAMonitoringServiceCore
{
    public class ParseJsonResponse
    {
        public string jiraID;
        public string jiraSummary;
        public string status;
        public string assignee;
        public DateTime created_date;
        public DateTime updated_date;
        public string issueType;
        public string fixVersion;
        public string priority;
        public string severity;
        public string customerFacingNextSteps;
        public string slaDaysInTriage;
        public double slaDaysInTriage_int;
        public string slaDaysInResolved;
        public double slaDaysInResolved_int;

        List<Summary> retVal = new List<Summary>();
        List<CustomerNextStepsUpdateSummary> customernextupdate = new List<CustomerNextStepsUpdateSummary>();
        List<StatusSummary> statusSummaries = new List<StatusSummary>();

        private void InitializeComponent()
        {
            jiraID = "";
            jiraSummary = "";
            status = "";
            assignee = "";
            created_date = new DateTime();
            updated_date = new DateTime();
            issueType = "";
            fixVersion = "";
            priority = "";
            severity = "";
            customerFacingNextSteps = "";
            slaDaysInTriage = "";
            slaDaysInResolved = "";
            slaDaysInTriage_int = 0;
            slaDaysInResolved_int = 0;

            customernextupdate = new List<CustomerNextStepsUpdateSummary>();
            statusSummaries = new List<StatusSummary>();
        }
        public List<Summary> ParseRespose(string response)
        {
            JObject joResponse = JObject.Parse(response);
            JArray issueArray = (JArray)joResponse["issues"];

            foreach (JObject issue in issueArray.Children<JObject>())
            {
                try
                {
                    InitializeComponent();
                    Console.WriteLine(issue);

                    jiraID = (string)issue.SelectToken("key");
                    jiraSummary = (string)issue.SelectToken("fields.summary");
                    status = (string)issue.SelectToken("fields.status.name");
                    assignee = (string)issue.SelectToken("fields.assignee.displayName");
                    created_date = (DateTime)issue.SelectToken("fields.created");
                    updated_date = (DateTime)issue.SelectToken("fields.updated");
                    issueType = (string)issue.SelectToken("fields.issuetype.name");
                    fixVersion = (string)issue.SelectToken("fields.fixVersions.name");
                    priority = (string)issue.SelectToken("fields.priority.name");
                    severity = (string)issue.SelectToken("fields.customfield_10243.value");
                    customerFacingNextSteps = (string)issue.SelectToken("fields.customfield_14136");

                    slaDaysInTriage = (string)issue.SelectToken("fields.customfield_14135");
                    if (slaDaysInTriage != null)
                        slaDaysInTriage_int = (double)issue.SelectToken("fields.customfield_14135");
                    //else
                    //    continue;

                    slaDaysInResolved = (string)issue.SelectToken("fields.customfield_11630");
                    if (slaDaysInResolved != null)
                        slaDaysInResolved_int = (double)issue.SelectToken("fields.customfield_11630");
                    //else
                    //    continue;

                    GetHistoryDetails((JObject)issue.SelectToken("changelog"));
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Exception Occured in Parsing JSON : {0}", ex.ToString());
                    continue;
                }

                retVal.Add(new Summary()
                {
                    JiraID = jiraID,
                    JiraSummary = jiraSummary,
                    Status = status,
                    Assignee = assignee,
                    Created_date = created_date,
                    Updated_date = updated_date,
                    IssueType = issueType,
                    FixVersion = fixVersion,
                    Priority = priority,
                    Severity = severity,
                    CustomerFacingNextSteps = customerFacingNextSteps,
                    CustomerNextStepsUpdate = customernextupdate,
                    StatusSummaries = statusSummaries,
                    SlaDaysInTriage = slaDaysInTriage != null ? slaDaysInTriage_int : -1,
                    SlaDaysInResolved = slaDaysInResolved != null ? slaDaysInResolved_int : -1
                });
            }
            return retVal;
        }

        /// <summary>
        /// GetHistoryDetails
        /// </summary>
        /// <param name="History"></param>
        private void GetHistoryDetails(JObject History)
        {
            JArray historiesArray = (JArray)History["histories"];
            foreach (JObject history in historiesArray.Children<JObject>())
            {
                JArray items = (JArray)history["items"];
                Console.WriteLine((DateTime)history.SelectToken("created"));
                foreach (JObject item in items.Children<JObject>())
                {
                    if ((string)item.SelectToken("field") == "Customer Facing Next Steps")
                    {
                        customernextupdate.Add(new CustomerNextStepsUpdateSummary() { Created_date = (DateTime)history.SelectToken("created"), from = (string)item.SelectToken("fromString"), to = (string)item.SelectToken("toString") });
                    }
                    if ((string)item.SelectToken("field") == "status")
                    {
                        statusSummaries.Add(new StatusSummary() { Created_date = (DateTime)history.SelectToken("created"), from = (string)item.SelectToken("fromString"), to = (string)item.SelectToken("toString") });
                    }
                }
            }
        }
    }

    // TBD: Need to review if we need all these detail.
    public struct Summary
    {
        public string JiraID { get; set; }
        public string JiraSummary { get; set; }
        public string Status { get; set; }
        public string Assignee { get; set; }
        public DateTime Created_date { get; set; }
        public DateTime Updated_date { get; set; }
        public string IssueType { get; set; }
        public string FixVersion { get; set; }
        public string Priority { get; set; }
        public string Severity { get; set; }
        public string CustomerFacingNextSteps { get; set; }
        public List<CustomerNextStepsUpdateSummary> CustomerNextStepsUpdate { get; set; }
        public List<StatusSummary> StatusSummaries { get; set; }
        public double SlaDaysInTriage { get; set; }
        public double SlaDaysInResolved { get; set; }
    }

    public struct CustomerNextStepsUpdateSummary
    {
        public DateTime Created_date { get; set; }
        public string from { get; set; }
        public string to { get; set; }
    }
    public struct StatusSummary
    {
        public DateTime Created_date { get; set; }
        public string from { get; set; }
        public string to { get; set; }
    }
}
