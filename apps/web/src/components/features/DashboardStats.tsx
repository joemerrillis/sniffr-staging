'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  UserGroupIcon, 
  MapIcon, 
  CurrencyDollarIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon }: StatsCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${changeColors[changeType]} mt-1`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats?: {
    totalDogs: number;
    activeWalks: number;
    revenue: number;
    bookings: number;
    dogChange?: string;
    walkChange?: string;
    revenueChange?: string;
    bookingChange?: string;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const defaultStats = {
    totalDogs: 127,
    activeWalks: 23,
    revenue: 4230,
    bookings: 89,
    dogChange: '+12 from last month',
    walkChange: '+2 from yesterday',
    revenueChange: '+8% from last week',
    bookingChange: '+5% from last week',
  };

  const data = stats || defaultStats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Dogs"
        value={data.totalDogs.toString()}
        change={data.dogChange}
        changeType="positive"
        icon={UserGroupIcon}
      />
      
      <StatsCard
        title="Active Walks"
        value={data.activeWalks.toString()}
        change={data.walkChange}
        changeType="positive"
        icon={MapIcon}
      />
      
      <StatsCard
        title="Revenue"
        value={formatCurrency(data.revenue)}
        change={data.revenueChange}
        changeType="positive"
        icon={CurrencyDollarIcon}
      />
      
      <StatsCard
        title="Bookings"
        value={data.bookings.toString()}
        change={data.bookingChange}
        changeType="positive"
        icon={CalendarIcon}
      />
    </div>
  );
}