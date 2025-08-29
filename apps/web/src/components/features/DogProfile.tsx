'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DogForm } from '@/components/forms/DogForm';
import { 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  owner: string;
  notes?: string;
  image?: string;
  status: 'active' | 'inactive' | 'boarding';
  lastWalk?: string;
  nextWalk?: string;
}

interface DogProfileProps {
  dog: Dog;
  onUpdate?: (dog: Dog) => Promise<void>;
  onDelete?: (dogId: string) => Promise<void>;
}

export function DogProfile({ dog, onUpdate, onDelete }: DogProfileProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (updatedData: any) => {
    if (!onUpdate) return;
    
    setIsLoading(true);
    try {
      await onUpdate({ ...dog, ...updatedData });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update dog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(dog.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete dog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'boarding':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                {dog.image ? (
                  <img
                    src={dog.image}
                    alt={dog.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-500">
                    {dog.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{dog.name}</CardTitle>
                <p className="text-gray-600">{dog.breed}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dog.status)}`}>
                {dog.status.charAt(0).toUpperCase() + dog.status.slice(1)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setIsEditModalOpen(true)}>
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsDeleteModalOpen(true)}>
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age:</span>
                    <span className="font-medium">{dog.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Weight:</span>
                    <span className="font-medium">{dog.weight} lbs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Owner:</span>
                    <span className="font-medium">{dog.owner}</span>
                  </div>
                </div>
              </div>

              {dog.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Notes</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                    {dog.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {dog.lastWalk && (
                    <div className="flex items-center space-x-3 text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Last Walk</p>
                        <p className="text-gray-500">{new Date(dog.lastWalk).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {dog.nextWalk && (
                    <div className="flex items-center space-x-3 text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Next Walk</p>
                        <p className="text-gray-500">{new Date(dog.nextWalk).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Favorite Location</p>
                      <p className="text-gray-500">Central Park</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button size="sm" className="w-full">
                  Schedule Walk
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  View Walk History
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Dog Profile"
        size="lg"
      >
        <DogForm
          dog={dog}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Dog Profile"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete {dog.name}'s profile? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isLoading}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}