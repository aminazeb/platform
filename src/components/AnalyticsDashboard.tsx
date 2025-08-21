"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, DollarSign, ShoppingCart, Upload, ArrowUpRight } from 'lucide-react';
import { Badge } from './ui/badge';

interface DashboardData {
  totalProducts: number;
  totalSales: number;
  totalPurchases: number;
  profitMargin: number;
  lowStockItems: number;
  recentActivity: Array<{
    id: string;
    action: string;
    item: string;
    timestamp: string;
  }>;
  salesData: Array<{
    date: string;
    sales: number;
    purchases: number;
    profit: number;
  }>;
}

export function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch sales data
      const salesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch purchases data
      const purchasesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Mock data for demonstration
      const mockData: DashboardData = {
        totalProducts: 245,
        totalSales: 15420,
        totalPurchases: 8930,
        profitMargin: 42.1,
        lowStockItems: 12,
        recentActivity: [
          { id: '1', action: 'Sale completed', item: 'Blue Pen (5 units)', timestamp: '2 hours ago' },
          { id: '2', action: 'Purchase added', item: 'Office Supplies from ABC Corp', timestamp: '4 hours ago' },
          { id: '3', action: 'Product archived', item: 'Old Keyboard Model', timestamp: '6 hours ago' },
          { id: '4', action: 'Low stock alert', item: 'Red Markers', timestamp: '8 hours ago' }
        ],
        salesData: [
          { date: '2025-01-10', sales: 1200, purchases: 800, profit: 400 },
          { date: '2025-01-11', sales: 1500, purchases: 900, profit: 600 },
          { date: '2025-01-12', sales: 1100, purchases: 700, profit: 400 },
          { date: '2025-01-13', sales: 1800, purchases: 1100, profit: 700 },
          { date: '2025-01-14', sales: 1600, purchases: 1000, profit: 600 },
          { date: '2025-01-15', sales: 2100, purchases: 1300, profit: 800 },
          { date: '2025-01-16', sales: 1900, purchases: 1200, profit: 700 }
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return <div className="space-y-6 animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cost of goods purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">Average profit margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales & Purchases Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [`$${value}`, name === 'sales' ? 'Sales' : name === 'purchases' ? 'Purchases' : 'Profit']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.item}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {activity.timestamp}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {dashboardData.lowStockItems > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You have <strong>{dashboardData.lowStockItems} items</strong> that are running low on stock.
              Consider restocking these items soon to avoid stockouts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}