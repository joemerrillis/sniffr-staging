import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage schedules</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Calendar component will be implemented here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}