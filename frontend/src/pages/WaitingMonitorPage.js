import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Plane, RefreshCw, TrendingUp, Clock } from "lucide-react";

const WaitingMonitorPage = () => {
  const [waitingBookings, setWaitingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWaitingList();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchWaitingList(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitingList = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const response = await axios.get(`${API}/waiting-list`);
      setWaitingBookings(response.data.bookings || []);
      if (silent) {
        toast.success("Updated waiting list positions");
      }
    } catch (error) {
      console.error("Error fetching waiting list:", error);
      if (!silent) {
        toast.error("Failed to fetch waiting list");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Waiting List Monitor</h1>
              <p className="text-gray-600">Real-time tracking of your waiting list bookings</p>
            </div>
            <Button
              onClick={() => fetchWaitingList()}
              variant="outline"
              disabled={refreshing}
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {waitingBookings.length === 0 ? (
            <Card className="text-center py-12 shadow-lg border-0">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">No waiting list bookings</p>
                <Button onClick={() => window.location.href = "/"} className="bg-blue-600 hover:bg-blue-700">
                  Book a Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {waitingBookings.map((booking) => (
                <Card key={booking.id} className="shadow-lg border-0 card-hover" data-testid={`waiting-booking-${booking.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {booking.trip_type === "train" ? (
                          <Train className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Plane className="w-6 h-6 text-green-600" />
                        )}
                        <div>
                          <CardTitle className="text-lg" data-testid={`booking-pnr-${booking.id}`}>PNR: {booking.pnr}</CardTitle>
                          <p className="text-sm text-gray-500">{booking.route}</p>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        Waiting List
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Position Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-gray-600 mb-1">Current Position</p>
                        <p className="text-2xl font-bold text-blue-600" data-testid={`waiting-position-${booking.id}`}>
                          WL-{booking.waiting_position}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-gray-600 mb-1">Confirmation Chance</p>
                        <p className="text-2xl font-bold text-green-600" data-testid={`prediction-${booking.id}`}>
                          {booking.prediction_percentage?.toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-gray-600 mb-1">Journey Date</p>
                        <p className="font-semibold text-purple-900">{booking.date}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-gray-600 mb-1">Passengers</p>
                        <p className="font-semibold text-orange-900">{booking.passengers.length}</p>
                      </div>
                    </div>

                    {/* AI Prediction Bar */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-700">AI Confirmation Prediction</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {booking.prediction_percentage?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full progress-bar"
                          style={{ width: `${booking.prediction_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Based on historical data and current booking trends
                      </p>
                    </div>

                    {/* Passengers */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Passengers:</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.passengers.map((passenger, idx) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1">
                            {passenger.name} ({passenger.age}y)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Last Update */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                      <Clock className="w-3 h-3" />
                      <span>Last updated: Just now</span>
                      <span className="ml-auto pulse-animation">🔄 Auto-refreshing every 30s</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Banner */}
          {waitingBookings.length > 0 && (
            <Card className="mt-8 bg-blue-50 border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">How does AI prediction work?</h3>
                    <p className="text-sm text-blue-800">
                      Our AI analyzes historical booking patterns, cancellation trends, waiting list movements, 
                      and travel date proximity to predict your confirmation chances in real-time. The prediction 
                      updates automatically as positions change.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingMonitorPage;