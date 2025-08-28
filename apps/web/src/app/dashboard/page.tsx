'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiClient, type Dog, type Walk, type WalkReport, type BoardingReport } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [walkReports, setWalkReports] = useState<WalkReport[]>([]);
  const [boardingReports, setBoardingReports] = useState<BoardingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dogsRes, walksRes, walkReportsRes, boardingReportsRes] = await Promise.all([
          apiClient.getDogs(),
          apiClient.getWalks(),
          apiClient.getWalkReports(),
          apiClient.getBoardingReports()
        ]);

        if (dogsRes.data) setDogs(dogsRes.data);
        if (walksRes.data) setWalks(walksRes.data);
        if (walkReportsRes.data) setWalkReports(walkReportsRes.data);
        if (boardingReportsRes.data) setBoardingReports(boardingReportsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getWalksByStatus = (status: string) => {
    return walks.filter(walk => walk.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'scheduled': return 'text-orange-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Dogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dogs.length}</div>
              <p className="text-xs text-gray-500">Registered dogs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Walks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getWalksByStatus('in_progress').length}</div>
              <p className="text-xs text-gray-500">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Completed Walks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getWalksByStatus('completed').length}</div>
              <p className="text-xs text-gray-500">Total completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walkReports.length + boardingReports.length}</div>
              <p className="text-xs text-gray-500">Walk & boarding reports</p>
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
              {walks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No walks found.
                </div>
              ) : (
                <div className="space-y-4">
                  {walks.slice(0, 5).map((walk) => {
                    const walkDogs = dogs.filter(dog => walk.dog_ids.includes(dog.id));
                    const dogNames = walkDogs.map(dog => dog.name).join(', ') || 'Unknown Dogs';
                    
                    return (
                      <div key={walk.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dogNames}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(walk.scheduled_start).toLocaleString()}
                          </p>
                          {walk.notes && (
                            <p className="text-xs text-gray-400">{walk.notes}</p>
                          )}
                        </div>
                        <span className={`text-sm ${getStatusColor(walk.status)}`}>
                          {formatStatus(walk.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {walkReports.length === 0 && boardingReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports available.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Walk Reports */}
                  {walkReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Walk Report</p>
                        <p className="text-sm text-gray-500">
                          Walk ID: {report.walk_id.substring(0, 8)}...
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {/* Boarding Reports */}
                  {boardingReports.slice(0, 2).map((report) => (
                    <div key={report.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Boarding Report</p>
                        <p className="text-sm text-gray-500">
                          Session ID: {report.boarding_session_id.substring(0, 8)}...
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}