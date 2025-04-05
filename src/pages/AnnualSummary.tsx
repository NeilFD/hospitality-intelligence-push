
import { ModuleType } from '@/types/kitchen-ledger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnnualSummaryProps {
  modulePrefix?: string;
  moduleType?: ModuleType;
}

export default function AnnualSummary({ modulePrefix = "", moduleType = "food" }: AnnualSummaryProps) {
  const pageTitle = modulePrefix ? `${modulePrefix} Annual Summary` : "Annual Summary";
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-tavern-blue mb-6">{pageTitle}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Annual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-center py-12 text-muted-foreground">
            Annual summary data coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
