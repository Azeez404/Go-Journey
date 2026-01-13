import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Train, Plane, User, Plus, Trash2, CreditCard, DollarSign } from "lucide-react";

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trip, searchParams } = location.state || {};

  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "male" }
  ]);
  const [bookingType, setBookingType] = useState(trip?.seats_available > 0 ? "confirmed" : "waiting");
  const [loading, setLoading] = useState(false);

  const addPassenger = () => {
    setPassengers([...passengers, { name: "", age: "", gender: "male" }]);
  };

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleBooking = async () => {
    // Validate passengers
    for (let p of passengers) {
      if (!p.name || !p.age) {
        toast.error("Please fill all passenger details");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/bookings`, {
        trip_id: tripId,
        trip_type: searchParams?.transportType || "train",
        passengers: passengers.map(p => ({ ...p, age: parseInt(p.age) })),
        booking_type: bookingType
      });

      toast.success("Booking successful!");
      navigate(`/confirmation/${response.data.id}`, { state: { booking: response.data, trip } });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <p className="text-gray-600 mb-4">Trip not found</p>
              <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalPrice = trip.price * passengers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Complete Your Booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Passenger Details */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Passenger Details</CardTitle>
                  <CardDescription>Enter details for all passengers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold">Passenger {index + 1}</h4>
                        </div>
                        {passengers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePassenger(index)}
                            data-testid={`remove-passenger-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>Name</Label>
                          <Input
                            placeholder="Full Name"
                            data-testid={`passenger-name-${index}`}
                            value={passenger.name}
                            onChange={(e) => updatePassenger(index, "name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Age</Label>
                          <Input
                            type="number"
                            placeholder="Age"
                            data-testid={`passenger-age-${index}`}
                            value={passenger.age}
                            onChange={(e) => updatePassenger(index, "age", e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Gender</Label>
                        <Select
                          value={passenger.gender}
                          onValueChange={(value) => updatePassenger(index, "gender", value)}
                        >
                          <SelectTrigger data-testid={`passenger-gender-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addPassenger}
                    data-testid="add-passenger-btn"
                    className="w-full border-dashed border-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Passenger
                  </Button>
                </CardContent>
              </Card>

              {/* Booking Type */}
              {trip.seats_available === 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Booking Option</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={bookingType} onValueChange={setBookingType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="waiting" id="waiting" />
                        <Label htmlFor="waiting" className="cursor-pointer">
                          Book on Waiting List (Higher confirmation chances with AI insights)
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Payment */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>Demo payment - No actual charges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-800">
                      This is a demo booking system. No payment will be processed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {searchParams?.transportType === "train" ? (
                      <Train className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Plane className="w-6 h-6 text-green-600" />
                    )}
                    <div>
                      <p className="font-bold">{trip.name}</p>
                      <p className="text-sm text-gray-500">{trip.number}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route</span>
                      <span className="font-medium">{trip.from} → {trip.to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure</span>
                      <span className="font-medium">{trip.departure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Arrival</span>
                      <span className="font-medium">{trip.arrival}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{trip.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passengers</span>
                      <span className="font-medium">{passengers.length}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600 flex items-center" data-testid="total-price">
                        <DollarSign className="w-5 h-5" />
                        {totalPrice}
                      </span>
                    </div>

                    <Button
                      onClick={handleBooking}
                      data-testid="confirm-booking-btn"
                      className="w-full bg-green-600 hover:bg-green-700 h-12"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Pay & Book"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;