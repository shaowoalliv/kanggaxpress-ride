import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit, MapPin, Globe, Search } from 'lucide-react';

interface Province {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
  province_id: string;
  geofence_lat: number;
  geofence_lng: number;
  geofence_radius_km: number;
  is_active: boolean;
  activation_date: string | null;
}

export default function Coverage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Search states
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  
  // Dialog states
  const [provinceDialogOpen, setProvinceDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  // Form states
  const [provinceForm, setProvinceForm] = useState({ name: '', code: '', is_active: true });
  const [cityForm, setCityForm] = useState({
    name: '',
    province_id: '',
    geofence_lat: 0,
    geofence_lng: 0,
    geofence_radius_km: 15,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [provincesRes, citiesRes] = await Promise.all([
        supabase.from('provinces').select('*').order('name'),
        supabase.from('cities').select('*').order('name'),
      ]);

      if (provincesRes.error) throw provincesRes.error;
      if (citiesRes.error) throw citiesRes.error;

      setProvinces(provincesRes.data || []);
      setCities(citiesRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProvince = async () => {
    try {
      if (editingProvince) {
        const { error } = await supabase
          .from('provinces')
          .update(provinceForm)
          .eq('id', editingProvince.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Province updated successfully' });
      } else {
        const { error } = await supabase
          .from('provinces')
          .insert([provinceForm]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Province created successfully' });
      }
      setProvinceDialogOpen(false);
      setEditingProvince(null);
      setProvinceForm({ name: '', code: '', is_active: true });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save province',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCity = async () => {
    try {
      if (editingCity) {
        const { error } = await supabase
          .from('cities')
          .update(cityForm)
          .eq('id', editingCity.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'City updated successfully' });
      } else {
        const { error } = await supabase
          .from('cities')
          .insert([cityForm]);
        if (error) throw error;
        toast({ title: 'Success', description: 'City created successfully' });
      }
      setCityDialogOpen(false);
      setEditingCity(null);
      setCityForm({
        name: '',
        province_id: '',
        geofence_lat: 0,
        geofence_lng: 0,
        geofence_radius_km: 15,
        is_active: true,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save city',
        variant: 'destructive',
      });
    }
  };

  const openProvinceDialog = (province?: Province) => {
    if (province) {
      setEditingProvince(province);
      setProvinceForm({
        name: province.name,
        code: province.code,
        is_active: province.is_active,
      });
    } else {
      setEditingProvince(null);
      setProvinceForm({ name: '', code: '', is_active: true });
    }
    setProvinceDialogOpen(true);
  };

  const openCityDialog = (city?: City) => {
    if (city) {
      setEditingCity(city);
      setCityForm({
        name: city.name,
        province_id: city.province_id,
        geofence_lat: city.geofence_lat,
        geofence_lng: city.geofence_lng,
        geofence_radius_km: city.geofence_radius_km,
        is_active: city.is_active,
      });
    } else {
      setEditingCity(null);
      setCityForm({
        name: '',
        province_id: '',
        geofence_lat: 0,
        geofence_lng: 0,
        geofence_radius_km: 15,
        is_active: true,
      });
    }
    setCityDialogOpen(true);
  };

  const getProvinceName = (provinceId: string) => {
    return provinces.find((p) => p.id === provinceId)?.name || 'Unknown';
  };

  // Filter provinces based on search
  const filteredProvinces = provinces.filter((province) =>
    province.name.toLowerCase().includes(provinceSearch.toLowerCase()) ||
    province.code.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  // Filter cities based on search
  const filteredCities = cities.filter((city) => {
    const provinceName = getProvinceName(city.province_id);
    return (
      city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      provinceName.toLowerCase().includes(citySearch.toLowerCase())
    );
  });

  return (
    <>
      <Helmet>
        <title>Geographic Coverage - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading">Geographic Coverage</h2>
          <p className="text-muted-foreground">Manage provinces and cities where KanggaXpress operates</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="provinces" className="space-y-6">
            <TabsList>
              <TabsTrigger value="provinces">
                <Globe className="w-4 h-4 mr-2" />
                Provinces
              </TabsTrigger>
              <TabsTrigger value="cities">
                <MapPin className="w-4 h-4 mr-2" />
                Cities
              </TabsTrigger>
            </TabsList>

            {/* Provinces Tab */}
            <TabsContent value="provinces" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Provinces</CardTitle>
                    <CardDescription>Manage provincial coverage areas</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search provinces..."
                        value={provinceSearch}
                        onChange={(e) => setProvinceSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Dialog open={provinceDialogOpen} onOpenChange={setProvinceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => openProvinceDialog()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Province
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingProvince ? 'Edit Province' : 'Add Province'}</DialogTitle>
                        <DialogDescription>
                          Configure province details and activation status
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Province Name</Label>
                          <Input
                            value={provinceForm.name}
                            onChange={(e) => setProvinceForm({ ...provinceForm, name: e.target.value })}
                            placeholder="e.g., Metro Manila"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Province Code</Label>
                          <Input
                            value={provinceForm.code}
                            onChange={(e) => setProvinceForm({ ...provinceForm, code: e.target.value.toUpperCase() })}
                            placeholder="e.g., NCR"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Active</Label>
                          <Switch
                            checked={provinceForm.is_active}
                            onCheckedChange={(checked) => setProvinceForm({ ...provinceForm, is_active: checked })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setProvinceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProvince}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProvinces.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            {provinceSearch ? 'No provinces found matching your search.' : 'No provinces found. Add one to get started.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProvinces.map((province) => (
                          <TableRow key={province.id}>
                            <TableCell className="font-medium">{province.name}</TableCell>
                            <TableCell>{province.code}</TableCell>
                            <TableCell>
                              <Badge variant={province.is_active ? 'default' : 'secondary'}>
                                {province.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openProvinceDialog(province)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cities Tab */}
            <TabsContent value="cities" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Cities</CardTitle>
                    <CardDescription>Manage city-level geofence boundaries</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search cities..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => openCityDialog()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add City
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{editingCity ? 'Edit City' : 'Add City'}</DialogTitle>
                          <DialogDescription>
                            Configure city geofence center and radius
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>City Name</Label>
                              <Input
                                value={cityForm.name}
                                onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                                placeholder="e.g., Calapan City"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Province</Label>
                              <Select
                                value={cityForm.province_id}
                                onValueChange={(value) => setCityForm({ ...cityForm, province_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                  {provinces.map((province) => (
                                    <SelectItem key={province.id} value={province.id}>
                                      {province.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Latitude</Label>
                              <Input
                                type="number"
                                step="0.000001"
                                value={cityForm.geofence_lat}
                                onChange={(e) => setCityForm({ ...cityForm, geofence_lat: Number(e.target.value) })}
                                placeholder="e.g., 13.4110"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Longitude</Label>
                              <Input
                                type="number"
                                step="0.000001"
                                value={cityForm.geofence_lng}
                                onChange={(e) => setCityForm({ ...cityForm, geofence_lng: Number(e.target.value) })}
                                placeholder="e.g., 121.1803"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Geofence Radius (km)</Label>
                            <Input
                              type="number"
                              step="0.5"
                              value={cityForm.geofence_radius_km}
                              onChange={(e) => setCityForm({ ...cityForm, geofence_radius_km: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Active</Label>
                            <Switch
                              checked={cityForm.is_active}
                              onCheckedChange={(checked) => setCityForm({ ...cityForm, is_active: checked })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveCity}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>Province</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Radius</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            {citySearch ? 'No cities found matching your search.' : 'No cities found. Add one to get started.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCities.map((city) => (
                          <TableRow key={city.id}>
                            <TableCell className="font-medium">{city.name}</TableCell>
                            <TableCell>{getProvinceName(city.province_id)}</TableCell>
                            <TableCell className="text-xs">
                              {city.geofence_lat.toFixed(4)}, {city.geofence_lng.toFixed(4)}
                            </TableCell>
                            <TableCell>{city.geofence_radius_km} km</TableCell>
                            <TableCell>
                              <Badge variant={city.is_active ? 'default' : 'secondary'}>
                                {city.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCityDialog(city)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
