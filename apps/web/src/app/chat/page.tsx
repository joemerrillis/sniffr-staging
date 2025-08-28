import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ChatPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with clients and team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer">
                  <div className="font-medium">Sarah Johnson</div>
                  <div className="text-sm text-gray-600">About Buddy's walk tomorrow...</div>
                  <div className="text-xs text-gray-500 mt-1">2 min ago</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Mike Davis</div>
                  <div className="text-sm text-gray-600">Luna's boarding dates</div>
                  <div className="text-xs text-gray-500 mt-1">1 hour ago</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Team Chat</div>
                  <div className="text-sm text-gray-600">Weekly schedule update</div>
                  <div className="text-xs text-gray-500 mt-1">3 hours ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Sarah Johnson</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[500px]">
              <div className="flex-1 p-4 bg-gray-50 rounded-lg mb-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm">Hi! I wanted to confirm Buddy's walk for tomorrow at 3 PM.</p>
                      <div className="text-xs text-gray-500 mt-1">2:15 PM</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm">Yes, that's confirmed! We'll pick him up at 2:45 PM.</p>
                      <div className="text-xs text-blue-100 mt-1">2:16 PM</div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm">Perfect! Thanks so much.</p>
                      <div className="text-xs text-gray-500 mt-1">2:17 PM</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}