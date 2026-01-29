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
const STATIONS = [
  { code: "JBP", name: "Jabalpur" },
  { code: "SRID", name: "Somnath" },
  { code: "NDLS", name: "New Delhi" },
  { code: "MAS", name: "Chennai Central" },
  { code: "CBE", name: "Coimbatore" },
  { code: "MDU", name: "Madurai" },
  { code: "BCT", name: "Mumbai Central" }
];

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
    const payload = {
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      date: format(date, "yyyy-MM-dd"),
      transport_type: transportType
    };

    console.log("SEARCH PAYLOAD →", payload);

    const response = await axios.post(`${API}/search`, payload);

    console.log("SEARCH RESPONSE →", response.data);

    navigate("/search", {
      state: {
        results: response.data.results,
        searchParams: payload
      }
    });
  } catch (error) {
    console.error("SEARCH ERROR →", error.response || error);
    toast.error(
      error.response?.data?.detail || "Search failed"
    );
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
          <Tabs defaultValue="route" className="w-full">
  <TabsList className="grid w-full grid-cols-2 mb-6">
    <TabsTrigger value="route">Route Search</TabsTrigger>
    <TabsTrigger value="pnr">PNR Search</TabsTrigger>
  </TabsList>

  {/* ROUTE SEARCH */}
  <TabsContent value="route">
    <form onSubmit={handleSearch} className="space-y-5">

      {/* From / To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>From</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="">Select source station</option>
            {STATIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>To</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Select destination station</option>
            {STATIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Quick Date Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" onClick={() => setDate(new Date())}>
          Today
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
          }
        >
          Tomorrow
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
          }
        >
          +2 Days
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
          }
        >
          +3 Days
        </Button>
      </div>

      {/* Calendar */}
      <div>
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Search */}
      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
        disabled={loading}
      >
        {loading ? "Searching..." : "Search Trains"}
      </Button>
    </form>
  </TabsContent>

  {/* PNR SEARCH (UI ONLY) */}
  <TabsContent value="pnr">
    <div className="space-y-4">
      <Label>PNR Number</Label>
      <Input placeholder="Enter 10-digit PNR" disabled />

      <Button className="w-full" disabled>
        Search PNR (Coming Soon)
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        PNR lookup will be available in the next update.
      </p>
    </div>
  </TabsContent>
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