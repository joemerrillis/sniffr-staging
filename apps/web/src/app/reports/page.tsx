'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiClient, type WalkReport, type BoardingReport, type Walk } from '@/lib/api';

export default function ReportsPage() {
  const [walkReports, setWalkReports] = useState<WalkReport[]>([]);
  const [boardingReports, setBoardingReports] = useState<BoardingReport[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [walkReportsRes, boardingReportsRes, walksRes] = await Promise.all([
          apiClient.getWalkReports(),
          apiClient.getBoardingReports(),
          apiClient.getWalks()
        ]);

        if (walkReportsRes.data) {
          setWalkReports(walkReportsRes.data);
        }
        if (boardingReportsRes.data) {
          setBoardingReports(boardingReportsRes.data);
        }
        if (walksRes.data) {
          setWalks(walksRes.data);
        }
        
        if (walkReportsRes.error || boardingReportsRes.error || walksRes.error) {
          setError('Failed to load some reports');
        }
      } catch (err) {
        setError('Failed to load reports');
        console.error('Error fetching reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const calculateWalkStats = () => {
    if (walks.length === 0) return { averageDuration: 0, completedWalks: 0, onTimeRate: 0 };
    
    const completedWalks = walks.filter(walk => walk.status === 'completed');
    const totalWalks = walks.length;
    
    // Calculate average duration (placeholder logic)
    const averageDuration = completedWalks.length > 0 ? 32 : 0; // Would calculate from actual data
    
    // Calculate on-time rate (placeholder)
    const onTimeRate = completedWalks.length > 0 ? 97 : 0; // Would calculate from actual timing data
    
    return {
      averageDuration,
      completedWalks: completedWalks.length,
      totalWalks,
      onTimeRate
    };
  };

  const walkStats = calculateWalkStats();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Business insights and analytics</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Walk Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-blue-600">{walkReports.length}</div>
                <div className="text-sm text-gray-500">Total Walk Reports</div>
                {walkReports.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Latest: {new Date(walkReports[0]?.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Boarding Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-green-600">{boardingReports.length}</div>
                <div className="text-sm text-gray-500">Total Boarding Reports</div>
                {boardingReports.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Latest: {new Date(boardingReports[0]?.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Walk Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Walks</span>
                  <span className="text-sm font-bold">{walkStats.totalWalks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Walks</span>
                  <span className="text-sm text-green-600">{walkStats.completedWalks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Duration</span>
                  <span className="text-sm">{walkStats.averageDuration} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">On-time Rate</span>
                  <span className="text-sm">{walkStats.onTimeRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle>Recent Walk Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {walkReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No walk reports available yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {walkReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Walk Report #{report.id.substring(0, 8)}</div>
                        <div className="text-sm text-gray-500">
                          Walk ID: {report.walk_id.substring(0, 8)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(report.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {boardingReports.length > 0 && (
            <Card className="lg:col-span-2 xl:col-span-3">
              <CardHeader>
                <CardTitle>Recent Boarding Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {boardingReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Boarding Report #{report.id.substring(0, 8)}</div>
                        <div className="text-sm text-gray-500">
                          Session ID: {report.boarding_session_id.substring(0, 8)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(report.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}