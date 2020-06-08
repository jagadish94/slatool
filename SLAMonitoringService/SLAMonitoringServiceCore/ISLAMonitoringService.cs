using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SLAMonitoringServiceCore
{
    public interface ISLAMonitoringService
    {
        bool PublishSLAInfo(Summary[] jiraDetails);
        void ReportFailure(string errorCode, string errorDescription);
    }
}
