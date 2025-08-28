'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Dog {
  id: string;
  name: string;
  breed: string;
  owner: string;
}

interface WalkSchedulerProps {
  dogs?: Dog[];
  onScheduleWalk?: (walkData: any) => Promise<void>;
}

const mockDogs: Dog[] = [
  { id: '1', name: 'Buddy', breed: 'Golden Retriever', owner: 'John Smith' },
  { id: '2', name: 'Luna', breed: 'Husky', owner: 'Sarah Johnson' },
  { id: '3', name: 'Charlie', breed: 'Labrador', owner: 'Mike Davis' },
  { id: '4', name: 'Bella', breed: 'Poodle', owner: 'Emily Chen' },
];

export function WalkScheduler({ dogs = mockDogs, onScheduleWalk }: WalkSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDogs, setSelectedDogs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '30',
    location: '',
    walker: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDogToggle = (dogId: string) => {
    setSelectedDogs(prev =>
      prev.includes(dogId)
        ? prev.filter(id => id !== dogId)
        : [...prev, dogId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDogs.length === 0) {
      alert('Please select at least one dog');
      return;
    }

    setIsSubmitting(true);

    try {
      const walkData = {
        ...formData,
        dogIds: selectedDogs,
        duration: parseInt(formData.duration),
        scheduledTime: `${formData.date}T${formData.time}`,
      };

      if (onScheduleWalk) {
        await onScheduleWalk(walkData);
      }

      // Reset form
      setFormData({
        date: '',
        time: '',
        duration: '30',
        location: '',
        walker: '',
        notes: '',
      });
      setSelectedDogs([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to schedule walk:', error);
      alert('Failed to schedule walk. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Schedule Walk
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Schedule New Walk"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dog Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Dogs
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {dogs.map((dog) => (
                <label
                  key={dog.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDogs.includes(dog.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-3 text-blue-600"
                    checked={selectedDogs.includes(dog.id)}
                    onChange={() => handleDogToggle(dog.id)}
                  />
                  <div>
                    <div className="font-medium">{dog.name}</div>
                    <div className="text-sm text-gray-500">{dog.breed} • {dog.owner}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Time"
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Duration and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <Input
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Central Park"
              required
            />
          </div>

          {/* Walker */}
          <Input
            label="Walker"
            name="walker"
            value={formData.walker}
            onChange={handleInputChange}
            placeholder="Assigned walker name"
            required
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1"
            >
              Schedule Walk
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}