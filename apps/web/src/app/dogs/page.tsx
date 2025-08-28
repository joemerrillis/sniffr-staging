import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

const mockDogs = [
  {
    id: '1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: 3,
    owner: 'John Smith',
    status: 'active',
    image: '/placeholder-dog.jpg',
  },
  {
    id: '2',
    name: 'Luna',
    breed: 'Husky',
    age: 2,
    owner: 'Sarah Johnson',
    status: 'active',
    image: '/placeholder-dog.jpg',
  },
  {
    id: '3',
    name: 'Charlie',
    breed: 'Labrador',
    age: 5,
    owner: 'Mike Davis',
    status: 'boarding',
    image: '/placeholder-dog.jpg',
  },
];

export default function DogsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dogs</h1>
            <p className="text-gray-600">Manage all registered dogs</p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Dog
          </Button>
        </div>

        {/* Dogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDogs.map((dog) => (
            <Card key={dog.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dog.name}</CardTitle>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dog.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : dog.status === 'boarding'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {dog.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Breed:</span>
                    <span className="text-sm font-medium">{dog.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Age:</span>
                    <span className="text-sm font-medium">{dog.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Owner:</span>
                    <span className="text-sm font-medium">{dog.owner}</span>
                  </div>
                  <div className="pt-4 flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
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