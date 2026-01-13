import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Train, Plane, Search, Clock, TrendingUp, Shield, Zap, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const HomePage = () => {
  const navigate = useNavigate();
  const [transportType, setTransportType] = useState("train");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date());
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  const fetchRecentSearches = async () => {
    try {
      const response = await axios.get(`${API}/search/recent`);
      setRecentSearches(response.data.searches || []);
    } catch (error) {
      console.error("Error fetching recent searches:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!origin || !destination) {
      toast.error("Please enter origin and destination");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/search`, {
        origin,
        destination,
        date: format(date, "yyyy-MM-dd"),
        transport_type: transportType
      });
      
      navigate("/search", { state: { results: response.data.results, searchParams: { origin, destination, date, transportType } } });
    } catch (error) {
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-green-600 bg-clip-text text-transparent">
            Book Smarter with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get real-time predictions for waiting list confirmations. Never miss a journey.
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-3xl mx-auto shadow-2xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Search Tickets</CardTitle>
            <CardDescription>Find trains and flights with AI-powered insights</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="train" value={transportType} onValueChange={setTransportType}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="train" data-testid="train-tab" className="flex items-center gap-2">
                  <Train className="w-4 h-4" />
                  Train
                </TabsTrigger>
                <TabsTrigger value="flight" data-testid="flight-tab" className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Flight
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">From</Label>
                    <Input
                      id="origin"
                      data-testid="origin-input"
                      placeholder="e.g., New Delhi"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">To</Label>
                    <Input
                      id="destination"
                      data-testid="destination-input"
                      placeholder="e.g., Mumbai"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-testid="date-picker-btn"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  type="submit"
                  data-testid="search-btn"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? (
                    "Searching..."
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search Tickets
                    </>
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="max-w-3xl mx-auto mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Searches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentSearches.slice(0, 4).map((search, idx) => (
                <Card
                  key={idx}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setOrigin(search.origin);
                    setDestination(search.destination);
                    setTransportType(search.transport_type);
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {search.transport_type === "train" ? (
                        <Train className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Plane className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {search.origin} → {search.destination}
                        </p>
                        <p className="text-xs text-gray-500">{search.transport_type}</p>
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Predictions</h3>
              <p className="text-gray-600 text-sm">
                Get real-time confirmation probability for waiting list bookings
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Live Updates</h3>
              <p className="text-gray-600 text-sm">
                Monitor your waiting list position in real-time
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Booking</h3>
              <p className="text-gray-600 text-sm">
                Fast and secure payment with instant confirmation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;