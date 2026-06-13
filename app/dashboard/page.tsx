import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Total Claims", value: "147", icon: FileText, change: "+12%", color: "blue" },
    { title: "Pending Investigation", value: "23", icon: Clock, change: "-3", color: "yellow" },
    { title: "Approved Today", value: "18", icon: CheckCircle, change: "+4", color: "green" },
    { title: "Average Risk Score", value: "3.8", icon: AlertTriangle, change: "-0.2", color: "red" },
  ];

  const recentClaims = [
    { id: "CLM-2026-4521", policyholder: "John Martinez", amount: "$18,500", risk: "HIGH", status: "Investigating", date: "2026-06-11" },
    { id: "CLM-2026-3345", policyholder: "Michael Rodriguez", amount: "$18,500", risk: "MEDIUM", status: "Investigating", date: "2026-06-08" },
    { id: "CLM-2026-1234", policyholder: "Sarah Johnson", amount: "$1,200", risk: "LOW", status: "Approved", date: "2026-06-06" },
    { id: "CLM-2026-3891", policyholder: "Robert Chen", amount: "$7,800", risk: "MEDIUM", status: "Pending", date: "2026-06-10" },
    { id: "CLM-2026-2678", policyholder: "Lisa Williams", amount: "$3,200", risk: "LOW", status: "Approved", date: "2026-06-09" },
  ];

  const getIconBg = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-100 text-blue-600";
      case "yellow": return "bg-yellow-100 text-yellow-600";
      case "green": return "bg-green-100 text-green-600";
      case "red": return "bg-red-100 text-red-600";
      default: return "bg-zinc-100 text-zinc-600";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "bg-green-50 text-green-700 border border-green-200";
      case "MEDIUM": return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "HIGH": return "bg-red-50 text-red-700 border border-red-200";
      default: return "bg-zinc-50 text-zinc-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "text-green-600";
      case "Investigating": return "text-yellow-600";
      case "Pending": return "text-zinc-500";
      default: return "text-zinc-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.title} className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-zinc-900 mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.change} from yesterday
                </p>
              </div>
              <div className={`p-3 rounded-xl ${getIconBg(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Claims */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900">Recent Claims</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-zinc-500 text-sm border-b border-zinc-100">
                <th className="px-6 py-4 font-medium">Claim ID</th>
                <th className="px-6 py-4 font-medium">Policyholder</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Risk</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.map((claim) => (
                <tr key={claim.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{claim.id}</td>
                  <td className="px-6 py-4 text-zinc-700">{claim.policyholder}</td>
                  <td className="px-6 py-4 font-semibold text-zinc-900">{claim.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(claim.risk)}`}>
                      {claim.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{claim.date}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-purple-600 text-sm font-medium transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
