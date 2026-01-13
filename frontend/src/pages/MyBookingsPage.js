import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Train, Plane, Calendar, Clock, User, XCircle, RefreshCw } from "lucide-react";

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case "waiting":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Waiting List</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === filter);

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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
            <Button
              onClick={() => fetchBookings()}
              variant="outline"
              size="sm"
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="all" onValueChange={setFilter}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="waiting">Waiting List</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-gray-600 mb-4">No bookings found</p>
                    <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
                      Book a Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="shadow-lg border-0" data-testid={`booking-card-${booking.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {booking.trip_type === "train" ? (
                              <Train className="w-6 h-6 text-blue-600" />
                            ) : (
                              <Plane className="w-6 h-6 text-green-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg" data-testid={`booking-pnr-${booking.id}`}>PNR: {booking.pnr}</h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-sm text-gray-500">{booking.route}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-semibold">{booking.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-gray-500">Passengers</p>
                                <p className="font-semibold">{booking.passengers.length}</p>
                              </div>
                            </div>
                            {booking.status === "waiting" && (
                              <div>
                                <p className="text-gray-500">Position</p>
                                <p className="font-semibold text-orange-600">WL-{booking.waiting_position}</p>
                              </div>
                            )}
                          </div>

                          {booking.status === "waiting" && booking.prediction_percentage && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-600">Confirmation Probability</p>
                                <p className="text-xs font-bold text-blue-600">
                                  {booking.prediction_percentage.toFixed(0)}%
                                </p>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-blue-600 to-green-600 h-1.5 rounded-full"
                                  style={{ width: `${booking.prediction_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {booking.status === "confirmed" || booking.status === "waiting" ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  data-testid={`cancel-btn-${booking.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this booking? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancel(booking.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Yes, cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;