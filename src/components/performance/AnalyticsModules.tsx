
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CircleDollarSign, TrendingUp, User, BarChart, Bot } from "lucide-react";

export default function AnalyticsModules() {
  const modules = [
    {
      title: "P&L Analysis",
      description: "Financial performance forecasting, expense pattern detection, and category breakdowns.",
      icon: <CircleDollarSign className="h-10 w-10 text-white" />,
      path: "/performance/pl-analysis",
      color: "from-hi-purple-light to-hi-purple-dark",
      hover: "from-hi-purple to-hi-purple-dark"
    },
    {
      title: "Wage Optimization",
      description: "Labor efficiency analysis, wage-to-revenue ratio insights, and predictive scheduling.",
      icon: <User className="h-10 w-10 text-white" />,
      path: "/performance/wage-optimization",
      color: "from-hi-purple-light/90 to-hi-purple/90",
      hover: "from-hi-purple-light to-hi-purple"
    },
    {
      title: "Food & Beverage Analysis",
      description: "GP performance insights, supplier analysis, and inventory optimization.",
      icon: <BarChart className="h-10 w-10 text-white" />,
      path: "/performance/fb-analysis",
      color: "from-hi-purple to-hi-purple-dark/90",
      hover: "from-hi-purple-dark to-hi-purple-dark"
    },
    {
      title: "Data Explorer",
      description: "Custom data exploration with natural language queries and advanced data visualizations.",
      icon: <Bot className="h-10 w-10 text-white" />,
      path: "/performance/data-explorer",
      color: "from-[#9d89c9] to-[#705b9b]",
      hover: "from-[#9d89c9] to-[#604c8c]"
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
            className="rounded-xl overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <CardHeader className={`bg-gradient-to-br ${module.color} text-white p-6`}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">{module.title}</CardTitle>
                {module.icon}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardDescription className="mb-6 text-sm min-h-[80px] text-gray-600">
                {module.description}
              </CardDescription>
              <Button asChild className={`w-full justify-between bg-gradient-to-r ${module.color} hover:bg-gradient-to-r hover:${module.hover} text-white shadow-sm`}>
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
