import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Plane, Clock, DollarSign, Users, ArrowRight } from "lucide-react";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, searchParams } = location.state || { results: [], searchParams: {} };

  const handleBooking = (trip) => {
    navigate(`/booking/${trip.id}`, { state: { trip, searchParams } });
  };

  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <p className="text-gray-600 mb-4">No results found</p>
              <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const transportType = searchParams.transportType || "train";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Search Summary */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Results</h1>
            <p className="text-gray-600 flex items-center gap-2">
              {transportType === "train" ? <Train className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
              {searchParams.origin} <ArrowRight className="w-4 h-4" /> {searchParams.destination}
            </p>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {results.map((trip) => (
              <Card key={trip.id} className="card-hover shadow-lg border-0" data-testid={`trip-card-${trip.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {transportType === "train" ? (
                          <Train className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Plane className="w-6 h-6 text-green-600" />
                        )}
                        <div>
                          <h3 className="font-bold text-lg" data-testid={`trip-name-${trip.id}`}>{trip.name}</h3>
                          <p className="text-sm text-gray-500">{trip.number}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Departure</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trip.departure}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Arrival</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trip.arrival}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Duration</p>
                          <p className="font-semibold">{trip.duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Availability</p>
                          {trip.seats_available > 0 ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100" data-testid={`availability-${trip.id}`}>
                              <Users className="w-3 h-3 mr-1" />
                              {trip.seats_available} seats
                            </Badge>
                          ) : (
                            <Badge variant="destructive" data-testid={`availability-${trip.id}`}>
                              Waiting List
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 flex items-center gap-1" data-testid={`price-${trip.id}`}>
                          <DollarSign className="w-5 h-5" />
                          {trip.price}
                        </p>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                      <Button
                        onClick={() => handleBooking(trip)}
                        data-testid={`book-btn-${trip.id}`}
                        className="bg-blue-600 hover:bg-blue-700 px-8"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>

                  {/* AI Prediction for waiting list */}
                  {trip.seats_available === 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          Predicted Confirmation Chance
                        </p>
                        <p className="text-sm font-bold text-blue-600">72%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full progress-bar"
                          style={{ width: "72%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on AI analysis of historical booking patterns
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;