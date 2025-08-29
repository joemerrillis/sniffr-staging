'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiClient, type Dog, type Household } from '@/lib/api';

interface DogFormProps {
  dog?: Dog;
  onSubmit: (data: Omit<Dog, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel?: () => void;
}

export function DogForm({ dog, onSubmit, onCancel }: DogFormProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [formData, setFormData] = useState({
    name: dog?.name || '',
    breed: dog?.breed || '',
    age: dog?.age?.toString() || '',
    weight: dog?.weight?.toString() || '',
    color: dog?.color || '',
    gender: dog?.gender || 'male',
    fixed: dog?.fixed || false,
    medications: dog?.medications?.join(', ') || '',
    allergies: dog?.allergies?.join(', ') || '',
    notes: dog?.notes || '',
    household_id: dog?.household_id || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const response = await apiClient.getHouseholds();
        if (response.data) {
          setHouseholds(response.data);
        }
      } catch (error) {
        console.error('Error fetching households:', error);
      }
    };
    fetchHouseholds();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Dog name is required';
    }

    if (!formData.household_id) {
      newErrors.household_id = 'Please select a household';
    }

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) <= 0)) {
      newErrors.age = 'Please enter a valid age';
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0)) {
      newErrors.weight = 'Please enter a valid weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: formData.name,
        breed: formData.breed || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        color: formData.color || undefined,
        gender: formData.gender as 'male' | 'female',
        fixed: formData.fixed,
        medications: formData.medications ? formData.medications.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        notes: formData.notes || undefined,
        household_id: formData.household_id,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{dog?.id ? 'Edit Dog' : 'Add New Dog'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Dog Name*"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter dog's name"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Household*
              </label>
              <select
                name="household_id"
                value={formData.household_id}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a household</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name}
                  </option>
                ))}
              </select>
              {errors.household_id && (
                <p className="mt-1 text-sm text-red-600">{errors.household_id}</p>
              )}
            </div>

            <Input
              label="Breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              error={errors.breed}
              placeholder="Enter breed (optional)"
            />

            <Input
              label="Color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Enter color (optional)"
            />

            <Input
              label="Age (years)"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              error={errors.age}
              placeholder="Enter age (optional)"
            />

            <Input
              label="Weight (lbs)"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              error={errors.weight}
              placeholder="Enter weight (optional)"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="fixed"
                name="fixed"
                checked={formData.fixed}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <label htmlFor="fixed" className="text-sm font-medium text-gray-700">
                Spayed/Neutered
              </label>
            </div>
          </div>

          <Input
            label="Medications"
            name="medications"
            value={formData.medications}
            onChange={handleChange}
            placeholder="Enter medications separated by commas (optional)"
          />

          <Input
            label="Allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            placeholder="Enter allergies separated by commas (optional)"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any special notes about the dog..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1"
            >
              {dog?.id ? 'Update Dog' : 'Add Dog'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}