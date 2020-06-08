using Newtonsoft.Json;
using SLAMonitoringServiceCore;
using System;
using System.Collections.Generic;
using System.IO;

namespace SLAMonitorPluginActivate
{
    [SLAMonitor("Activate")]
    class SLA_Calculation : ISLAMonitoringService
    {
        public static double SLA_ResponseTotalTime;
        public double SLA_ResolvedTotalTime;
        public double SLA_UpdateFrequencyTotalTime;

        public string response_Action = "";
        public string resolved_Action = "";
        public string update_Action = "";

        public int limit;
        public TimeSpan diff_seconds;
        public StatusSummary[] onStatus;
        public CustomerNextStepsUpdateSummary[] nextStepsUpdateSummaries;

        List<Json> SLA = new List<Json>();
        List<sLA_For_Response> sLA_Response = new List<sLA_For_Response>();
        List<sLA_Update_Frequency> sLA_Update = new List<sLA_Update_Frequency>();
        List<sLA_Days_To_Resolve> sLA_Resolved = new List<sLA_Days_To_Resolve>();

        private string outputFilePath = @"C:\ProgramData\NCR APTRA\SLAMonitorTool\output.json";

        /// <summary>
        /// InitializeComponent
        /// </summary>
        private void Reset()
        {
            SLA_ResponseTotalTime = 0;
            SLA_ResolvedTotalTime = 0;
            SLA_UpdateFrequencyTotalTime = 0;

            response_Action = "";
            resolved_Action = "";
            update_Action = "";

            limit = 0;

            diff_seconds = TimeSpan.Zero;
            onStatus = null;
            nextStepsUpdateSummaries = null;

            sLA_Response = new List<sLA_For_Response>();
            sLA_Update = new List<sLA_Update_Frequency>();
            sLA_Resolved = new List<sLA_Days_To_Resolve>();

        }

        /// <summary>
        /// Get_SLA
        /// </summary>
        /// <param name="response"></param>
        public bool PublishSLAInfo(Summary[] response)
        {
            bool retVal = false;

            try
            {
                string jiraID = "";
                string jiraSummary = "";
                string severity = "";
                string priority = "";

                DateTime creatDate = new DateTime();
                DateTime now = new DateTime();

                now = DateTime.Now;
                SLA = new List<Json>();

                if (response != null && response.Length > 0)
                {
                    foreach (Summary sum in response)
                    {
                        Reset();

                        jiraID = sum.JiraID;
                        Console.WriteLine("Jira ID: {0}", jiraID);
                        jiraSummary = sum.JiraSummary;
                        creatDate = sum.Created_date;
                        severity = sum.Severity;
                        priority = sum.Priority;

                        //SLA for Response
                        Get_sLA_for_Response(sum, severity, creatDate, now);

                        //SLA Days to Resolve calculation
                        Get_sLA_Days_To_Resolve(sum, severity, creatDate, now);

                        //SLA Update Frequency calculation
                        Get_SLA_Update_Frequency(sum, severity, creatDate, now);

                        SLA.Add(new Json() { JiraID = jiraID, Severity = severity, Priority = priority, SLA_For_Response = sLA_Response, SLA_Update_Frequency = sLA_Update, SLA_Days_To_Resolve = sLA_Resolved });
                    }
                    //creating json file as output.json
                    if (SLA != null || SLA.Count != 0)
                    {
                        string jsondata = JsonConvert.SerializeObject(SLA);
                        string path = outputFilePath;
                        if (File.Exists(path))
                            File.Delete(path);
                        using (var tw = new StreamWriter(path, true))
                        {
                            tw.WriteLine(jsondata.ToString());
                            tw.Close();
                        }
                    }
                }

                retVal = true;
            }
            catch { 
                //TBD Log exception details..
            }

            return retVal;
        }


        /// <summary>
        /// SLA for Response
        /// </summary>
        /// <param name="sum"></param>
        /// <param name="severity"></param>
        /// <param name="creatDate"></param>
        /// <param name="now"></param>
        private void Get_sLA_for_Response(Summary sum, string severity, DateTime creatDate, DateTime now)
        {
            if (severity == "S1")
                limit = 1;
            else if (severity == "S2")
                limit = 3;
            else if (severity == "S3")
                limit = 7;
            else
                limit = 14;

            if (sum.Status == "Not Started" || sum.Status == "In Triage")
            {
                diff_seconds = now - creatDate;
                Console.WriteLine("timespan : ", diff_seconds);
                SLA_ResponseTotalTime = limit - diff_seconds.TotalDays;
                if (SLA_ResponseTotalTime > 0)
                    response_Action = "initial";
                else
                {
                    response_Action = "missed";
                    //SLA_ResponseTotalTime = 0;
                }
                Console.WriteLine("sla for response : {0}", SLA_ResponseTotalTime);
                SLA_ResponseTotalTime = Convert.ToDouble(String.Format("{0:0.00}", SLA_ResponseTotalTime));
                Console.WriteLine("sla for response : {0}", SLA_ResponseTotalTime);
                Console.WriteLine(" response Action : {0}", response_Action);
            }
            else
            {
                SLA_ResponseTotalTime = sum.SlaDaysInTriage;
                //SLA_ResponseTotalTime = limit - SLA_ResponseTotalTime;
                Console.WriteLine("sla for response : {0}", SLA_ResponseTotalTime);
                if (SLA_ResponseTotalTime >= 0)
                    response_Action = "targetMet";
                else
                {
                    response_Action = "missed";
                    //SLA_ResponseTotalTime = 0;
                }
                SLA_ResponseTotalTime = Convert.ToDouble(String.Format("{0:0.00}", SLA_ResponseTotalTime));
                Console.WriteLine("sla for response :{0} ", SLA_ResponseTotalTime);

                Console.WriteLine(" response Action : {0}", response_Action);
            }
            sLA_Response.Add(new sLA_For_Response() { SLA = SLA_ResponseTotalTime, Action = response_Action });
        }

        /// <summary>
        /// SLA Days To Resolve
        /// </summary>
        /// <param name="sum"></param>
        /// <param name="severity"></param>
        /// <param name="creatDate"></param>
        /// <param name="now"></param>
        private void Get_sLA_Days_To_Resolve(Summary sum, string severity, DateTime creatDate, DateTime now)
        {
            diff_seconds = now - creatDate;
            TimeSpan notHoldTime = TimeSpan.Zero;
            TimeSpan HoldTime = TimeSpan.Zero; ;
            TimeSpan TotalHold = TimeSpan.Zero;
            TimeSpan TotalNotHold = TimeSpan.Zero;
            int count = 1;
            int length = 0;

            if (severity == "S1")
                limit = 3;
            else if (severity == "S2")
                limit = 15;
            else if (severity == "S3")
                limit = 30;
            else
                limit = 90;

            ///////////Not Using If block///////////////
            onStatus = sum.StatusSummaries.ToArray();
            if (onStatus != null && onStatus.Length > 0)
            {
                DateTime toHoldDate = new DateTime();
                DateTime fromHoldDate = new DateTime();


                foreach (StatusSummary statusCheck in onStatus)
                {
                    // status is updated to "On Hold" 
                    if (statusCheck.from != "On Hold" && statusCheck.to == "On Hold" && count == 1)
                    {
                        fromHoldDate = statusCheck.Created_date;
                        notHoldTime = fromHoldDate - creatDate;
                        TotalNotHold = notHoldTime;
                        count++;
                    }

                    //// status is updated to other status from "On Hold"
                    if (statusCheck.from == "On Hold" && statusCheck.to != "On Hold")
                    {
                        toHoldDate = statusCheck.Created_date;
                        HoldTime = toHoldDate - fromHoldDate;
                        if (HoldTime > TimeSpan.Zero)
                        {
                            TotalHold = TotalHold + HoldTime;
                        }
                    }
                    if (statusCheck.from != "On Hold" && statusCheck.to == "On Hold" && count >= 2 && TotalHold > TimeSpan.Zero)
                    {
                        fromHoldDate = statusCheck.Created_date;
                        notHoldTime = fromHoldDate - toHoldDate;
                        if (notHoldTime > TimeSpan.Zero)
                        {
                            TotalNotHold = TotalNotHold + notHoldTime;
                        }
                    }
                    if (length == onStatus.Length - 1 && statusCheck.to == "On Hold")
                    {
                        HoldTime = now - statusCheck.Created_date;
                        if (HoldTime > TimeSpan.Zero)
                        {
                            TotalHold = TotalHold + HoldTime;
                        }
                    }
                    length++;
                }
                if (now - creatDate == TotalHold + TotalNotHold)
                {
                    Console.WriteLine("got it");
                }
                else
                {
                    Console.WriteLine("missed");
                }
            }
            ///////////////////Not Using/////////////////////
            SLA_ResolvedTotalTime = sum.SlaDaysInResolved;
            if (SLA_ResolvedTotalTime == -1)
            {
                diff_seconds = now - creatDate;
                SLA_ResolvedTotalTime = limit - diff_seconds.TotalDays;
                SLA_ResolvedTotalTime = Convert.ToDouble(String.Format("{0:0.00}", SLA_ResolvedTotalTime));
                Console.WriteLine("sla days to resolve :{0} ", SLA_ResolvedTotalTime);
            }
            else
            {
                SLA_ResolvedTotalTime = limit - SLA_ResolvedTotalTime;
                SLA_ResolvedTotalTime = Convert.ToDouble(String.Format("{0:0.00}", SLA_ResolvedTotalTime));
                Console.WriteLine("sla days to resolve :{0} ", SLA_ResolvedTotalTime);
            }
            if (SLA_ResolvedTotalTime > 0)
            {
                resolved_Action = "initial";
            }
            else
            {
                SLA_ResolvedTotalTime = 0;
                resolved_Action = "missed";
            }
            sLA_Resolved.Add(new sLA_Days_To_Resolve() { SLA = SLA_ResolvedTotalTime, Action = resolved_Action });
        }


        /// <summary>
        /// SLA Update Frequency
        /// </summary>
        /// <param name="sum"></param>
        /// <param name="severity"></param>
        /// <param name="creatDate"></param>
        /// <param name="now"></param>
        private void Get_SLA_Update_Frequency(Summary sum, string severity, DateTime creatDate, DateTime now)
        {
            DateTime updateDate = new DateTime();
            double remaining_for_update;
            string customerFacingNextStep = "";
            if (severity == "S1")
                limit = 1;
            else if (severity == "S2")
                limit = 7;
            else if (severity == "S3")
                limit = 14;
            else
                limit = 30;

            customerFacingNextStep = sum.CustomerFacingNextSteps;
            nextStepsUpdateSummaries = sum.CustomerNextStepsUpdate.ToArray();
            if (nextStepsUpdateSummaries != null && nextStepsUpdateSummaries.Length > 0 && customerFacingNextStep != null)
            {

                foreach (CustomerNextStepsUpdateSummary nextUpdateSummary in nextStepsUpdateSummaries)
                {
                    updateDate = nextUpdateSummary.Created_date;
                }
                diff_seconds = now - updateDate;
                remaining_for_update = limit - diff_seconds.TotalDays;
                Console.WriteLine("sla update frequency :{0} ", remaining_for_update);

                if (SLA_ResolvedTotalTime < remaining_for_update || SLA_ResolvedTotalTime <= 0)
                {
                    SLA_UpdateFrequencyTotalTime = SLA_ResolvedTotalTime;
                }
                else
                {
                    SLA_UpdateFrequencyTotalTime = remaining_for_update;
                }
                SLA_UpdateFrequencyTotalTime = Convert.ToDouble(String.Format("{0:0.00}", SLA_UpdateFrequencyTotalTime));
                Console.WriteLine("sla update frequency :{0} ", SLA_UpdateFrequencyTotalTime);
            }
            else
            {
                diff_seconds = now - creatDate;
                remaining_for_update = limit - diff_seconds.TotalDays;
                Console.WriteLine("sla update frequency :{0} ", remaining_for_update);

                if (SLA_ResolvedTotalTime < remaining_for_update || SLA_ResolvedTotalTime <= 0)
                {
                    SLA_UpdateFrequencyTotalTime = SLA_ResolvedTotalTime;
                }
                else
                {
                    SLA_UpdateFrequencyTotalTime = remaining_for_update;
                }
                SLA_UpdateFrequencyTotalTime = Convert.ToDouble(String.Format("{0:0.00}", SLA_UpdateFrequencyTotalTime));
                Console.WriteLine("sla update frequency :{0} ", SLA_UpdateFrequencyTotalTime);
            }

            if (SLA_UpdateFrequencyTotalTime > 0)
            {
                update_Action = "initial";
            }
            else
            {
                update_Action = "missed";
                SLA_UpdateFrequencyTotalTime = 0;
            }
            sLA_Update.Add(new sLA_Update_Frequency() { SLA = SLA_UpdateFrequencyTotalTime, Action = update_Action });
        }

        public void ReportFailure(string errorCode, string errorDescription)
        {
            // tBD: WRite this in a json so that the data can be picked up by the client application.
            throw new NotImplementedException();
        }

        public class Json
        {
            public string JiraID { get; set; }
            public string Severity { get; set; }
            public string Priority { get; set; }
            public List<sLA_For_Response> SLA_For_Response { get; set; }
            public List<sLA_Update_Frequency> SLA_Update_Frequency { get; set; }
            public List<sLA_Days_To_Resolve> SLA_Days_To_Resolve { get; set; }

        }
        public struct sLA_For_Response
        {
            public double SLA { get; set; }
            public string Action { get; set; }
        }
        public struct sLA_Update_Frequency
        {
            public double SLA { get; set; }
            public string Action { get; set; }
        }
        public struct sLA_Days_To_Resolve
        {
            public double SLA { get; set; }
            public string Action { get; set; }
        }
    }
}
