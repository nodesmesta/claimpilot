import { Card, CardHeader, CardContent } from "@heroui/react";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Claims",
      value: "147",
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      change: "+12%",
      color: "blue",
    },
    {
      title: "Pending Investigation",
      value: "23",
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      change: "-3",
      color: "yellow",
    },
    {
      title: "Approved Today",
      value: "18",
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      change: "+4",
      color: "green",
    },
    {
      title: "Average Risk Score",
      value: "3.8",
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      change: "-0.2",
      color: "red",
    },
  ];

  const recentClaims = [
    {
      id: "CLM-2026-4521",
      policyholder: "John Martinez",
      amount: "$18,500",
      risk: "HIGH",
      status: "Investigating",
      date: "2026-06-11",
    },
    {
      id: "CLM-2026-3345",
      policyholder: "Michael Rodriguez",
      amount: "$18,500",
      risk: "MEDIUM",
      status: "Investigating",
      date: "2026-06-08",
    },
    {
      id: "CLM-2026-1234",
      policyholder: "Sarah Johnson",
      amount: "$1,200",
      risk: "LOW",
      status: "Approved",
      date: "2026-06-06",
    },
    {
      id: "CLM-2026-3891",
      policyholder: "Robert Chen",
      amount: "$7,800",
      risk: "MEDIUM",
      status: "Pending",
      date: "2026-06-10",
    },
    {
      id: "CLM-2026-2678",
      policyholder: "Lisa Williams",
      amount: "$3,200",
      risk: "LOW",
      status: "Approved",
      date: "2026-06-09",
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "HIGH": return "bg-red-500/20 text-red-500 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "text-green-500";
      case "Investigating": return "text-yellow-500";
      case "Pending": return "text-zinc-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-zinc-900/50 border border-zinc-800">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-zinc-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change} from yesterday
                </p>
              </div>
              <div className="p-3 bg-zinc-800 rounded-xl">
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Claims */}
      <Card className="bg-zinc-900/50 border border-zinc-800">
        <CardHeader className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">Recent Claims</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-400 text-sm border-b border-zinc-800">
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
                  <tr key={claim.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{claim.id}</td>
                    <td className="px-6 py-4">{claim.policyholder}</td>
                    <td className="px-6 py-4 font-semibold">{claim.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(claim.risk)}`}>
                        {claim.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{claim.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-500 hover:text-blue-400 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}