import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

const mockWalks = [
  {
    id: '1',
    dogs: ['Buddy', 'Max'],
    walker: 'Sarah Johnson',
    location: 'Central Park',
    duration: 30,
    status: 'completed',
    scheduledTime: '2024-01-15 09:00',
    completedTime: '2024-01-15 09:28',
  },
  {
    id: '2',
    dogs: ['Luna'],
    walker: 'Mike Davis',
    location: 'Riverside Park',
    duration: 45,
    status: 'in-progress',
    scheduledTime: '2024-01-15 14:00',
    startedTime: '2024-01-15 14:05',
  },
  {
    id: '3',
    dogs: ['Charlie', 'Bella'],
    walker: 'Emily Chen',
    location: 'Dog Park',
    duration: 20,
    status: 'scheduled',
    scheduledTime: '2024-01-15 16:30',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'scheduled':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};


export default function WalksPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Walks</h1>
            <p className="text-gray-600">Manage all dog walks and schedules</p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Schedule Walk
          </Button>
        </div>

        {/* Walk Cards */}
        <div className="space-y-4">
          {mockWalks.map((walk) => (
            <Card key={walk.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {walk.dogs.join(', ')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Walker: {walk.walker}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          walk.status
                        )}`}
                      >
                        {walk.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {walk.location}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {walk.duration} minutes
                      </div>
                      <div>
                        Scheduled: {new Date(walk.scheduledTime).toLocaleString()}
                      </div>
                      {walk.status === 'completed' && walk.completedTime && (
                        <div>
                          Completed: {new Date(walk.completedTime).toLocaleString()}
                        </div>
                      )}
                      {walk.status === 'in-progress' && walk.startedTime && (
                        <div>
                          Started: {new Date(walk.startedTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {walk.status === 'scheduled' && (
                      <Button size="sm" variant="outline">
                        Start Walk
                      </Button>
                    )}
                    {walk.status === 'in-progress' && (
                      <Button size="sm">
                        Complete Walk
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}