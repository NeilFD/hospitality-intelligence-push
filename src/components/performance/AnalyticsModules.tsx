
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CircleDollarSign, TrendingUp, User, BarChart, Bot } from "lucide-react";

export default function AnalyticsModules() {
  const modules = [
    {
      title: "P&L Analysis",
      description: "Financial performance forecasting, expense pattern detection, and category breakdowns.",
      icon: <CircleDollarSign className="h-10 w-10 text-tavern-blue opacity-80" />,
      path: "/performance/pl-analysis",
      color: "bg-gradient-to-br from-blue-50 to-blue-100"
    },
    {
      title: "Wage Optimization",
      description: "Labor efficiency analysis, wage-to-revenue ratio insights, and predictive scheduling.",
      icon: <User className="h-10 w-10 text-orange-500 opacity-80" />,
      path: "/performance/wage-optimization",
      color: "bg-gradient-to-br from-orange-50 to-orange-100"
    },
    {
      title: "Food & Beverage Analysis",
      description: "GP performance insights, supplier analysis, and inventory optimization.",
      icon: <BarChart className="h-10 w-10 text-green-600 opacity-80" />,
      path: "/performance/fb-analysis",
      color: "bg-gradient-to-br from-green-50 to-green-100"
    },
    {
      title: "Data Explorer",
      description: "Custom data exploration with natural language queries and advanced data visualizations.",
      icon: <Bot className="h-10 w-10 text-purple-600 opacity-80" />,
      path: "/performance/data-explorer",
      color: "bg-gradient-to-br from-purple-50 to-purple-100"
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-tavern-blue">Analytics Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module, index) => (
          <Card key={index} className={`shadow-md border-tavern-blue-light/20 hover:shadow-lg transition-all duration-300 overflow-hidden ${module.color}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{module.title}</CardTitle>
              </div>
              {module.icon}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 text-sm min-h-[60px]">
                {module.description}
              </CardDescription>
              <Button asChild variant="outline" className="w-full justify-between border-tavern-blue text-tavern-blue hover:bg-tavern-blue hover:text-white">
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
