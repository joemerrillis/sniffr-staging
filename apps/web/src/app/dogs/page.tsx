'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DogForm } from '@/components/forms/DogForm';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient, type Dog } from '@/lib/api';


export default function DogsPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getDogs();
      if (response.data) {
        setDogs(response.data);
        setError(null);
      } else {
        setError(response.error?.message || 'Failed to fetch dogs');
      }
    } catch (err) {
      setError('Failed to fetch dogs');
      console.error('Error fetching dogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDog = async (dogData: Omit<Dog, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiClient.createDog(dogData);
      if (response.data) {
        await fetchDogs(); // Refresh the list
        setIsAddModalOpen(false);
      } else {
        throw new Error(response.error?.message || 'Failed to create dog');
      }
    } catch (err) {
      console.error('Error creating dog:', err);
      throw err; // Let the form handle the error
    }
  };

  const handleEditDog = async (dogData: Omit<Dog, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    if (!selectedDog) return;
    
    try {
      const response = await apiClient.updateDog(selectedDog.id, dogData);
      if (response.data) {
        await fetchDogs(); // Refresh the list
        setIsEditModalOpen(false);
        setSelectedDog(null);
      } else {
        throw new Error(response.error?.message || 'Failed to update dog');
      }
    } catch (err) {
      console.error('Error updating dog:', err);
      throw err; // Let the form handle the error
    }
  };

  const handleDeleteDog = async (dogId: string) => {
    if (!confirm('Are you sure you want to delete this dog?')) {
      return;
    }
    
    try {
      const response = await apiClient.deleteDog(dogId);
      if (response.data?.success) {
        setDogs(dogs.filter(dog => dog.id !== dogId));
      } else {
        throw new Error(response.error?.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Error deleting dog:', err);
      alert('Failed to delete dog');
    }
  };

  const handleViewDog = (dog: Dog) => {
    setSelectedDog(dog);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (dog: Dog) => {
    setSelectedDog(dog);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading dogs...</div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-600">Error: {error}</div>
          <Button onClick={fetchDogs}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dogs</h1>
            <p className="text-gray-600">Manage all registered dogs</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchDogs} disabled={isLoading}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Dog
            </Button>
          </div>
        </div>

        {dogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No dogs registered yet.</p>
            <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Dog
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dogs.map((dog) => (
              <Card key={dog.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dog.name}</CardTitle>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dog.breed && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Breed:</span>
                        <span className="text-sm font-medium">{dog.breed}</span>
                      </div>
                    )}
                    {dog.age && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Age:</span>
                        <span className="text-sm font-medium">{dog.age} years</span>
                      </div>
                    )}
                    {dog.weight && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Weight:</span>
                        <span className="text-sm font-medium">{dog.weight} lbs</span>
                      </div>
                    )}
                    {dog.color && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Color:</span>
                        <span className="text-sm font-medium">{dog.color}</span>
                      </div>
                    )}
                    <div className="pt-4 flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewDog(dog)}
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleEditClick(dog)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteDog(dog.id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Dog Modal */}
      <Modal 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Dog"
        size="lg"
      >
        <DogForm 
          onSubmit={handleAddDog}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Dog Modal */}
      <Modal 
        open={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDog(null);
        }}
        title="Edit Dog"
        size="lg"
      >
        {selectedDog && (
          <DogForm 
            dog={selectedDog}
            onSubmit={handleEditDog}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedDog(null);
            }}
          />
        )}
      </Modal>

      {/* View Dog Modal */}
      <Modal 
        open={isViewModalOpen} 
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDog(null);
        }}
        title="Dog Details"
        size="lg"
      >
        {selectedDog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Breed</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.breed || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.age ? `${selectedDog.age} years` : 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.weight ? `${selectedDog.weight} lbs` : 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.color || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedDog.gender || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Spayed/Neutered</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.fixed ? 'Yes' : 'No'}</p>
              </div>
            </div>
            {selectedDog.medications && selectedDog.medications.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Medications</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.medications.join(', ')}</p>
              </div>
            )}
            {selectedDog.allergies && selectedDog.allergies.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Allergies</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.allergies.join(', ')}</p>
              </div>
            )}
            {selectedDog.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDog.notes}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedDog(null);
                }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
              >
                Edit Dog
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}