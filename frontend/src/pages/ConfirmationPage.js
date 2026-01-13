import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Train, Plane, User, Calendar, Clock } from "lucide-react";

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, trip } = location.state || {};

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <p className="text-gray-600 mb-4">Booking not found</p>
              <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8 fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {booking.status === "confirmed" ? "Booking Confirmed!" : "Waiting List Booked!"}
            </h1>
            <p className="text-gray-600">
              {booking.status === "confirmed" 
                ? "Your ticket has been confirmed successfully"
                : "You're on the waiting list. We'll notify you when confirmed."}
            </p>
          </div>

          {/* Booking Details Card */}
          <Card className="shadow-2xl border-0 mb-6" data-testid="confirmation-card">
            <CardContent className="p-8">
              {/* PNR */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">PNR Number</p>
                <p className="text-3xl font-bold text-blue-600" data-testid="pnr-number">{booking.pnr}</p>
              </div>

              {/* Trip Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  {booking.trip_type === "train" ? (
                    <Train className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Plane className="w-6 h-6 text-green-600" />
                  )}
                  <div>
                    <p className="font-bold text-lg">{trip?.name || "Trip"}</p>
                    <p className="text-sm text-gray-500">{trip?.number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-600">Journey Date</p>
                      <p className="font-semibold">{booking.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-600">Departure</p>
                      <p className="font-semibold">{trip?.departure}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Route</p>
                  <p className="font-semibold">{booking.route}</p>
                </div>
              </div>

              {/* Passengers */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Passengers
                </h3>
                <div className="space-y-2">
                  {booking.passengers.map((passenger, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium">{passenger.name}</p>
                        <p className="text-sm text-gray-500">
                          {passenger.age} years • {passenger.gender}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {booking.status === "confirmed" ? "Confirmed" : `WL-${booking.waiting_position}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waiting List Prediction */}
              {booking.status === "waiting" && booking.prediction_percentage && (
                <div className="border-t mt-6 pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-700">AI Confirmation Prediction</p>
                      <p className="text-lg font-bold text-blue-600" data-testid="prediction-percentage">
                        {booking.prediction_percentage.toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full progress-bar"
                        style={{ width: `${booking.prediction_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Current waiting list position: WL-{booking.waiting_position}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/my-bookings")}
              data-testid="view-bookings-btn"
              className="bg-blue-600 hover:bg-blue-700"
            >
              View My Bookings
            </Button>
            {booking.status === "waiting" && (
              <Button
                onClick={() => navigate("/waiting-monitor")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Track Waiting List
              </Button>
            )}
            <Button
              onClick={() => navigate("/")}
              variant="outline"
            >
              Book Another Ticket
            </Button>
          </div>

          {/* Note */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>A confirmation email has been sent to your registered email address.</p>
            {booking.status === "waiting" && (
              <p className="mt-2 text-blue-600">
                We'll notify you immediately when your ticket gets confirmed!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;