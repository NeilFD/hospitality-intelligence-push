
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PerformanceDashboard() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-tavern-blue mb-6 text-center">Performance & Analysis Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-md border-tavern-blue-light/20 rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b border-tavern-blue-light/20">
            <CardTitle>Performance & Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg text-center py-12 text-muted-foreground">
              Performance & Analysis functionality coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
