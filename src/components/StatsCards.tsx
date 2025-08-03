'use client';

import { LucideIcon } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change?: string;
}

interface StatsCardsProps {
  stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <span className="ml-2 text-sm font-medium text-green-600">
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Also export the interfaces for use in other files
export type { StatCard, StatsCardsProps };