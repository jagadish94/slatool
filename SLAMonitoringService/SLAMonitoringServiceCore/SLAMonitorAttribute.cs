using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SLAMonitoringServiceCore
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public class SLAMonitorAttribute : System.Attribute
    {
        public string ProductName { get; private set; }

        public SLAMonitorAttribute(string prodName)
        {
            ProductName = prodName;
        }
    }
}
