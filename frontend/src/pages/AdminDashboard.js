import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Clock, XCircle, Train, Plane, FileText, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [allGrievances, setAllGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes, grievancesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/bookings`),
        axios.get(`${API}/admin/grievances`)
      ]);
      setStats(statsRes.data);
      setAllBookings(bookingsRes.data);
      setAllGrievances(grievancesRes.data);
    } catch (error) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case "waiting":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Waiting</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Overview of all bookings and system activity</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-800" data-testid="total-bookings">
                      {stats?.total_bookings || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Confirmed</p>
                    <p className="text-3xl font-bold text-green-600" data-testid="confirmed-bookings">
                      {stats?.confirmed || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Waiting List</p>
                    <p className="text-3xl font-bold text-orange-600" data-testid="waiting-bookings">
                      {stats?.waiting || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                    <p className="text-3xl font-bold text-red-600" data-testid="cancelled-bookings">
                      {stats?.cancelled || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Bookings and Grievances */}
          <Tabs defaultValue="bookings">
            <TabsList className="mb-6">
              <TabsTrigger value="bookings">All Bookings</TabsTrigger>
              <TabsTrigger value="grievances">Grievances</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allBookings.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">No bookings yet</p>
                    ) : (
                      allBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`admin-booking-${booking.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {booking.trip_type === "train" ? (
                                <Train className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Plane className="w-5 h-5 text-green-600" />
                              )}
                              <div>
                                <p className="font-semibold">PNR: {booking.pnr}</p>
                                <p className="text-sm text-gray-500">{booking.route}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right text-sm">
                                <p className="text-gray-600">Passengers</p>
                                <p className="font-semibold">{booking.passengers.length}</p>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grievances">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    All Grievances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allGrievances.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">No grievances submitted</p>
                    ) : (
                      allGrievances.map((grievance) => (
                        <div
                          key={grievance.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`admin-grievance-${grievance.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold capitalize">{grievance.category}</p>
                              <p className="text-xs text-gray-500">Ref: {grievance.id}</p>
                            </div>
                            <Badge
                              className={grievance.status === "pending" 
                                ? "bg-orange-100 text-orange-800 hover:bg-orange-100" 
                                : "bg-green-100 text-green-800 hover:bg-green-100"
                              }
                            >
                              {grievance.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                            {grievance.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;