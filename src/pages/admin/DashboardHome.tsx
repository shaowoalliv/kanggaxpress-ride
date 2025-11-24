import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, XCircle, Package, DollarSign, TrendingUp, MapPin, Globe, Activity, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  systemEarnings: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  dailyActiveRiders: number;
  dailyActiveDrivers: number;
  dailyDeliveries: number;
  driverRejections: number;
  totalTrips: {
    today: number;
    month: number;
  };
}

interface GeofenceStats {
  activeProvinces: number;
  activeCities: number;
  totalServiceArea: number;
  outOfCoverageAttempts: number;
}

interface CityPerformance {
  cityId: string;
  cityName: string;
  tripsToday: number;
  activeDrivers: number;
  revenueToday: number;
  isActive: boolean;
}

interface IncomeData {
  date: string;
  income: number;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    systemEarnings: { daily: 0, weekly: 0, monthly: 0 },
    dailyActiveRiders: 0,
    dailyActiveDrivers: 0,
    dailyDeliveries: 0,
    driverRejections: 0,
    totalTrips: { today: 0, month: 0 },
  });
  const [geofenceStats, setGeofenceStats] = useState<GeofenceStats>({
    activeProvinces: 0,
    activeCities: 0,
    totalServiceArea: 0,
    outOfCoverageAttempts: 0,
  });
  const [cityPerformance, setCityPerformance] = useState<CityPerformance[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchGeofenceData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch completed rides for system earnings
      const { data: completedRides } = await supabase
        .from('rides')
        .select('app_fee, completed_at, passenger_id, driver_id, status')
        .eq('status', 'completed')
        .not('completed_at', 'is', null);

      // Calculate system earnings
      const dailyEarnings = completedRides?.filter(r => r.completed_at && r.completed_at >= todayStart)
        .reduce((sum, r) => sum + (r.app_fee || 0), 0) || 0;
      const weeklyEarnings = completedRides?.filter(r => r.completed_at && r.completed_at >= weekStart)
        .reduce((sum, r) => sum + (r.app_fee || 0), 0) || 0;
      const monthlyEarnings = completedRides?.filter(r => r.completed_at && r.completed_at >= monthStart)
        .reduce((sum, r) => sum + (r.app_fee || 0), 0) || 0;

      // Daily active riders (unique passengers who created rides today)
      const { data: todayRides } = await supabase
        .from('rides')
        .select('passenger_id')
        .gte('created_at', todayStart);
      const uniqueRiders = new Set(todayRides?.map(r => r.passenger_id) || []).size;

      // Daily active drivers (unique drivers who accepted/completed rides today)
      const { data: activeDriverRides } = await supabase
        .from('rides')
        .select('driver_id')
        .not('driver_id', 'is', null)
        .gte('accepted_at', todayStart);
      const uniqueDrivers = new Set(activeDriverRides?.map(r => r.driver_id) || []).size;

      // Daily deliveries (completed deliveries today)
      const { data: deliveries, count: deliveryCount } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .gte('delivered_at', todayStart);

      // Driver rejections today (cancelled rides)
      const { count: rejectionCount } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('created_at', todayStart);

      // Total trips (today and this month)
      const { count: todayTripsCount } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', todayStart);

      const { count: monthTripsCount } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', monthStart);

      setStats({
        systemEarnings: {
          daily: dailyEarnings,
          weekly: weeklyEarnings,
          monthly: monthlyEarnings,
        },
        dailyActiveRiders: uniqueRiders,
        dailyActiveDrivers: uniqueDrivers,
        dailyDeliveries: deliveryCount || 0,
        driverRejections: rejectionCount || 0,
        totalTrips: {
          today: todayTripsCount || 0,
          month: monthTripsCount || 0,
        },
      });

      // Generate income trend data for last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - i));
        return date;
      });

      const trendData = last30Days.map(date => {
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        
        const dayIncome = completedRides?.filter(r => 
          r.completed_at && r.completed_at >= dayStart && r.completed_at < dayEnd
        ).reduce((sum, r) => sum + (r.app_fee || 0), 0) || 0;

        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          income: dayIncome,
        };
      });

      setIncomeData(trendData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeofenceData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Fetch provinces and cities
      const { data: provinces } = await supabase
        .from('provinces')
        .select('*')
        .eq('is_active', true);

      const { data: cities } = await supabase
        .from('cities')
        .select('*, provinces(name, code)')
        .eq('is_active', true);

      // Calculate total service area (sum of city geofence areas)
      const totalArea = cities?.reduce((sum, city) => {
        const radiusKm = city.geofence_radius_km || 0;
        const areaKm2 = Math.PI * radiusKm * radiusKm;
        return sum + areaKm2;
      }, 0) || 0;

      // Out of coverage attempts (rides created but no pickup_lat/lng or outside geofence)
      const { count: outOfCoverage } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('created_at', todayStart);

      setGeofenceStats({
        activeProvinces: provinces?.length || 0,
        activeCities: cities?.length || 0,
        totalServiceArea: Math.round(totalArea),
        outOfCoverageAttempts: outOfCoverage || 0,
      });

      // City performance data
      const cityPerf = await Promise.all(
        (cities || []).map(async (city) => {
          // Get rides for this city today
          const { count: tripsCount } = await supabase
            .from('rides')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('completed_at', todayStart);

          // Get active drivers in this city today
          const { data: activeDrivers } = await supabase
            .from('driver_profiles')
            .select('id')
            .eq('is_available', true);

          // Get revenue for this city today
          const { data: cityRides } = await supabase
            .from('rides')
            .select('app_fee')
            .eq('status', 'completed')
            .gte('completed_at', todayStart);

          const revenue = cityRides?.reduce((sum, r) => sum + (r.app_fee || 0), 0) || 0;

          return {
            cityId: city.id,
            cityName: city.name,
            tripsToday: tripsCount || 0,
            activeDrivers: activeDrivers?.length || 0,
            revenueToday: revenue,
            isActive: city.is_active,
          };
        })
      );

      setCityPerformance(cityPerf);
    } catch (error) {
      console.error('Error fetching geofence data:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading">Dashboard</h2>
          <p className="text-muted-foreground">Overview of KanggaXpress operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{stats.systemEarnings.daily.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Today • Week: ₱{stats.systemEarnings.weekly.toFixed(2)} • Month: ₱{stats.systemEarnings.monthly.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active Riders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyActiveRiders}</div>
              <p className="text-xs text-muted-foreground">Unique passengers today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active Drivers</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyActiveDrivers}</div>
              <p className="text-xs text-muted-foreground">Drivers active today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyDeliveries}</div>
              <p className="text-xs text-muted-foreground">Completed deliveries today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Driver Rejections</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.driverRejections}</div>
              <p className="text-xs text-muted-foreground">Cancelled rides today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips.today}</div>
              <p className="text-xs text-muted-foreground">
                Today • Month: {stats.totalTrips.month}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Coverage Overview */}
        <div>
          <h3 className="text-xl font-bold mb-4">Geographic Coverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Provinces</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{geofenceStats.activeProvinces}</div>
                <p className="text-xs text-muted-foreground">Serving regions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cities</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{geofenceStats.activeCities}</div>
                <p className="text-xs text-muted-foreground">Cities operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Area</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{geofenceStats.totalServiceArea}</div>
                <p className="text-xs text-muted-foreground">sq km coverage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Coverage</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{geofenceStats.outOfCoverageAttempts}</div>
                <p className="text-xs text-muted-foreground">Attempts today</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* City Performance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>City Performance Today</CardTitle>
            <p className="text-sm text-muted-foreground">Performance metrics by city</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">City</th>
                    <th className="text-right py-3 px-4">Trips</th>
                    <th className="text-right py-3 px-4">Active Drivers</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cityPerformance.map((city) => (
                    <tr key={city.cityId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{city.cityName}</td>
                      <td className="text-right py-3 px-4">{city.tripsToday}</td>
                      <td className="text-right py-3 px-4">{city.activeDrivers}</td>
                      <td className="text-right py-3 px-4">₱{city.revenueToday.toFixed(2)}</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={city.isActive ? "default" : "secondary"}>
                          {city.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {cityPerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No cities available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Manage geographic coverage and pricing</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/admin/pricing')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing by Province
              </Button>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Manage City Activation
              </Button>
              <Button variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                View Coverage Map
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Income Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>System Income Trends</CardTitle>
            <p className="text-sm text-muted-foreground">Platform fees over the last 30 days</p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                income: {
                  label: "Income",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
