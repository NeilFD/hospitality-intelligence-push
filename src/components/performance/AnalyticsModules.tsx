
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CircleDollarSign, TrendingUp, User, BarChart, Bot } from "lucide-react";

export default function AnalyticsModules() {
  const modules = [
    {
      title: "P&L Analysis",
      description: "Financial performance forecasting, expense pattern detection, and category breakdowns.",
      icon: <CircleDollarSign className="h-8 w-8 text-hi-purple" />,
      path: "/performance/pl-analysis",
      color: "from-pastel-purple/50 to-pastel-purple/30",
      hover: "from-pastel-purple/60 to-pastel-purple/40",
      bgColor: "bg-pastel-purple/10",
      borderColor: "border-hi-purple/20"
    },
    {
      title: "Wage Optimization",
      description: "Labor efficiency analysis, wage-to-revenue ratio insights, and predictive scheduling.",
      icon: <User className="h-8 w-8 text-pastel-blue" />,
      path: "/performance/wage-optimization",
      color: "from-pastel-blue/50 to-pastel-blue/30",
      hover: "from-pastel-blue/60 to-pastel-blue/40",
      bgColor: "bg-pastel-blue/10",
      borderColor: "border-pastel-blue/20"
    },
    {
      title: "Food & Beverage Analysis",
      description: "GP performance insights, supplier analysis, and inventory optimization.",
      icon: <BarChart className="h-8 w-8 text-pastel-green" />,
      path: "/performance/fb-analysis",
      color: "from-pastel-green/50 to-pastel-green/30",
      hover: "from-pastel-green/60 to-pastel-green/40",
      bgColor: "bg-pastel-green/10",
      borderColor: "border-pastel-green/20"
    },
    {
      title: "Data Explorer",
      description: "Custom data exploration with natural language queries and advanced data visualizations.",
      icon: <Bot className="h-8 w-8 text-hi-purple-light" />,
      path: "/performance/data-explorer",
      color: "from-[#E5DEFF]/50 to-[#E5DEFF]/30",
      hover: "from-[#E5DEFF]/60 to-[#E5DEFF]/40",
      bgColor: "bg-[#E5DEFF]/20",
      borderColor: "border-[#E5DEFF]/40"
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-hi-purple flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        Analytics Modules
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module, index) => (
          <Card 
            key={index} 
            className={`rounded-xl overflow-hidden border ${module.borderColor} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
          >
            <CardHeader className={`${module.bgColor} p-5`}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-gray-800">{module.title}</CardTitle>
                <div className={`rounded-full p-2 ${module.bgColor}`}>
                  {module.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <CardDescription className="mb-5 text-sm min-h-[70px] text-gray-600">
                {module.description}
              </CardDescription>
              <Button asChild className={`w-full justify-between bg-gradient-to-r ${module.color} hover:bg-gradient-to-r hover:${module.hover} text-gray-700 shadow-sm`}>
                <Link to={module.path}>
                  Explore <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
