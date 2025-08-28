import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Sniffr dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Dogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-gray-500">+12 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Walks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-gray-500">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$4,230</div>
              <p className="text-xs text-gray-500">+8% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-gray-500">+5% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Walks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Buddy & Max</p>
                    <p className="text-sm text-gray-500">Central Park - 30 min</p>
                  </div>
                  <span className="text-green-600 text-sm">Completed</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Luna</p>
                    <p className="text-sm text-gray-500">Riverside Park - 45 min</p>
                  </div>
                  <span className="text-blue-600 text-sm">In Progress</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Charlie</p>
                    <p className="text-sm text-gray-500">Dog Park - 20 min</p>
                  </div>
                  <span className="text-orange-600 text-sm">Scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Boarding - Bella</p>
                    <p className="text-sm text-gray-500">Dec 15-20, 2024</p>
                  </div>
                  <span className="text-sm text-gray-600">5 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Walk - Rocky</p>
                    <p className="text-sm text-gray-500">Tomorrow 3:00 PM</p>
                  </div>
                  <span className="text-sm text-gray-600">30 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daycare - Milo</p>
                    <p className="text-sm text-gray-500">Dec 28, 2024</p>
                  </div>
                  <span className="text-sm text-gray-600">Full day</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}