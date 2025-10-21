import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DemographicStatistics } from '../../types';

interface DemographicsChartProps {
  data: DemographicStatistics;
}

const AGE_COLORS = {
  '13-17': '#3B82F6',   // blue-500
  '18-24': '#10B981',   // green-500
  '25-34': '#F59E0B',   // amber-500
  '35-44': '#8B5CF6',   // violet-500
  '45-54': '#EC4899',   // pink-500
  '55+': '#EF4444',     // red-500
  'unknown': '#6B7280', // gray-500
};

const GENDER_COLORS = {
  male: '#3B82F6',     // blue-500
  female: '#EC4899',   // pink-500
  'non-binary': '#8B5CF6', // violet-500
  unknown: '#6B7280',  // gray-500
};

export function DemographicsChart({ data }: DemographicsChartProps) {
  // Prepare age distribution data
  const ageData = Object.entries(data.age.distribution).map(([ageGroup, count]) => ({
    ageGroup,
    count,
    percentage: data.agePercentages[ageGroup as keyof typeof data.agePercentages],
  })).filter(item => item.count > 0);

  // Prepare gender data for pie chart
  const genderData = [
    { name: 'Male', value: data.gender.male, percentage: data.genderPercentages.male },
    { name: 'Female', value: data.gender.female, percentage: data.genderPercentages.female },
    { name: 'Non-binary', value: data.gender['non-binary'], percentage: data.genderPercentages['non-binary'] },
    { name: 'Unknown', value: data.gender.unknown, percentage: data.genderPercentages.unknown },
  ].filter(item => item.value > 0);

  // Prepare location data (top 10 countries)
  const topCountries = Object.entries(data.location.countries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([country, count]) => ({
      country: country.length > 15 ? country.substring(0, 15) + '...' : country,
      count,
      fullCountry: country,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold">{data.fullCountry || data.ageGroup || data.name}</p>
          <p className="text-sm">
            Count: {payload[0].value}
            {data.percentage && (
              <span className="ml-2 text-gray-500">
                ({data.percentage.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Age Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Age Distribution
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="ageGroup" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AGE_COLORS[entry.ageGroup as keyof typeof AGE_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Average Age</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{data.age.average.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Median Age</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{data.age.median}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{data.total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Unknown Age</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{data.age.distribution.unknown}</p>
          </div>
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Gender Distribution
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name.toLowerCase() as keyof typeof GENDER_COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Countries */}
      {topCountries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Top Countries
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCountries} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="country" 
                  stroke="#6B7280"
                  fontSize={12}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
