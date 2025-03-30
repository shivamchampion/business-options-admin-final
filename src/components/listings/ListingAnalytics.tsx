import React, { useState } from 'react';
import { BarChart, LineChart, PieChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Line, Pie, Cell } from 'recharts';
import { BarChart2, TrendingUp, Users, Eye, MousePointer, Calendar } from 'lucide-react';
import { AnalyticsData } from '@/types/listings';
import { formatDate } from '@/lib/utils';

interface ListingAnalyticsProps {
  analytics?: AnalyticsData;
}

const ListingAnalytics: React.FC<ListingAnalyticsProps> = ({ analytics }) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('30days');
  
  // If no analytics data is available
  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
        <BarChart2 className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <h4 className="text-gray-600 font-medium mb-1">No Analytics Available</h4>
        <p className="text-sm text-gray-500">This listing does not have any analytics data yet.</p>
      </div>
    );
  }
  
  // Calculate conversion rate
  const conversionRate = analytics.contactCount > 0 && analytics.viewCount > 0
    ? ((analytics.contactCount / analytics.viewCount) * 100).toFixed(1)
    : '0.0';
  
  // Prepare timeline data for chart
  const getTimelineData = () => {
    if (!analytics.viewsTimeline || analytics.viewsTimeline.length === 0) {
      return [];
    }
    
    // Sort by date
    const sortedTimeline = [...analytics.viewsTimeline].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Apply time range filter
    const now = new Date();
    let filteredTimeline = sortedTimeline;
    
    if (timeRange === '7days') {
      const cutoffDate = new Date(now.setDate(now.getDate() - 7));
      filteredTimeline = sortedTimeline.filter(item => new Date(item.date) >= cutoffDate);
    } else if (timeRange === '30days') {
      const cutoffDate = new Date(now.setDate(now.getDate() - 30));
      filteredTimeline = sortedTimeline.filter(item => new Date(item.date) >= cutoffDate);
    }
    
    return filteredTimeline.map(item => ({
      date: formatDate(item.date).split(' ')[0], // Get only the date part
      views: item.count
    }));
  };
  
  // Data for traffic sources pie chart
  const sourcesData = [
    { name: 'Direct', value: 45 },
    { name: 'Search', value: 30 },
    { name: 'Referral', value: 15 },
    { name: 'Social', value: 10 }
  ];
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const timelineData = getTimelineData();
  
  return (
    <div>
      {/* KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Total Views</div>
            <div className="rounded-full p-2 bg-blue-50">
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.viewCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Lifetime page views</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Unique Visitors</div>
            <div className="rounded-full p-2 bg-green-50">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.uniqueViewCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Distinct users who viewed the listing</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Contact Requests</div>
            <div className="rounded-full p-2 bg-amber-50">
              <MousePointer className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.contactCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Users who contacted about this listing</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
            <div className="rounded-full p-2 bg-purple-50">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{conversionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Percentage of views that lead to contact</div>
        </div>
      </div>
      
      {/* Time range selector for charts */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <BarChart2 className="mr-2 h-5 w-5 text-gray-500" />
          Traffic Overview
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Time range:</span>
          <div className="flex rounded-md shadow-sm">
            <button
              className={`px-3 py-1 text-sm font-medium rounded-l-md ${
                timeRange === '7days'
                  ? 'bg-[#0031ac] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border'
              }`}
              onClick={() => setTimeRange('7days')}
            >
              7 Days
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium ${
                timeRange === '30days'
                  ? 'bg-[#0031ac] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border-y'
              }`}
              onClick={() => setTimeRange('30days')}
            >
              30 Days
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium rounded-r-md ${
                timeRange === 'all'
                  ? 'bg-[#0031ac] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border'
              }`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>
        </div>
      </div>
      
      {/* Views Timeline Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          Views Timeline
        </h4>
        
        {timelineData.length > 0 ? (
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString()}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#0031ac"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Page Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">No timeline data available for the selected period.</p>
          </div>
        )}
      </div>
      
      {/* Traffic Sources Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Traffic Sources</h4>
        
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {sourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="lg:w-1/2 mt-4 lg:mt-0 lg:pl-6 flex flex-col justify-center">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Source Breakdown</h5>
            
            <div className="space-y-3">
              {sourcesData.map((source, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{source.name}</span>
                      <span className="text-sm text-gray-600">{source.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${source.value}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-xs text-gray-500 italic">
              Note: Traffic source data is estimated based on available information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingAnalytics;