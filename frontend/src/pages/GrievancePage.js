import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Send } from "lucide-react";

const GrievancePage = () => {
  const [bookings, setBookings] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    booking_id: "",
    category: "refund",
    description: ""
  });

  useEffect(() => {
    fetchBookings();
    fetchGrievances();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchGrievances = async () => {
    try {
      const response = await axios.get(`${API}/grievances`);
      setGrievances(response.data);
    } catch (error) {
      console.error("Error fetching grievances:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.booking_id || !formData.description) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/grievances`, formData);
      toast.success("Grievance submitted successfully!");
      setFormData({ booking_id: "", category: "refund", description: "" });
      fetchGrievances();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit grievance");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    return status === "pending" 
      ? <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
      : <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Refund & Grievance</h1>
            <p className="text-gray-600">Submit your concerns and track their resolution</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submission Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit New Grievance
                  </CardTitle>
                  <CardDescription>We'll review and respond within 24-48 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="booking">Select Booking *</Label>
                      <Select
                        value={formData.booking_id}
                        onValueChange={(value) => setFormData({ ...formData, booking_id: value })}
                        required
                      >
                        <SelectTrigger id="booking" data-testid="booking-select">
                          <SelectValue placeholder="Select a booking" />
                        </SelectTrigger>
                        <SelectContent>
                          {bookings.map((booking) => (
                            <SelectItem key={booking.id} value={booking.id}>
                              PNR: {booking.pnr} - {booking.route}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="category" data-testid="category-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refund">Refund Request</SelectItem>
                          <SelectItem value="delay">Delay/Cancellation</SelectItem>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        data-testid="description-input"
                        placeholder="Please describe your concern in detail..."
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      data-testid="submit-grievance-btn"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit Grievance"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Important Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <div>
                    <h4 className="font-semibold mb-1">Refund Policy</h4>
                    <p className="text-xs text-gray-600">
                      Refunds are processed within 5-7 business days after approval.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Response Time</h4>
                    <p className="text-xs text-gray-600">
                      We typically respond within 24-48 hours.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Support Hours</h4>
                    <p className="text-xs text-gray-600">
                      Monday-Friday: 9 AM - 6 PM
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Previous Grievances */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Your Grievances
            </h2>
            {grievances.length === 0 ? (
              <Card className="shadow-lg border-0 text-center py-12">
                <CardContent>
                  <p className="text-gray-600">No grievances submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {grievances.map((grievance) => (
                  <Card key={grievance.id} className="shadow-lg border-0" data-testid={`grievance-${grievance.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold" data-testid={`grievance-category-${grievance.id}`}>
                              {grievance.category.charAt(0).toUpperCase() + grievance.category.slice(1)}
                            </h3>
                            {getStatusBadge(grievance.status)}
                          </div>
                          <p className="text-sm text-gray-500">Ref ID: {grievance.id}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(grievance.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3" data-testid={`grievance-description-${grievance.id}`}>
                        {grievance.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievancePage;