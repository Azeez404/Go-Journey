import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "../App";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle, Info, XCircle, Mail, MailOpen } from "lucide-react";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "booking":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "update":
        return <Info className="w-5 h-5 text-blue-600" />;
      case "cancellation":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "refund":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const variants = {
      booking: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      cancellation: "bg-red-100 text-red-800",
      refund: "bg-orange-100 text-orange-800"
    };
    return variants[type] || "bg-gray-100 text-gray-800";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? (
                  <span className="font-semibold text-blue-600">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  "All caught up!"
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          {notifications.length === 0 ? (
            <Card className="text-center py-12 shadow-lg border-0">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">No notifications yet</p>
                <Button onClick={() => window.location.href = "/"} className="bg-blue-600 hover:bg-blue-700">
                  Book Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`shadow-md border-0 card-hover cursor-pointer transition-all ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-l-4 border-l-blue-600'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className={`${getTypeBadge(notification.type)} hover:${getTypeBadge(notification.type)}`}>
                            {notification.type}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            {notification.read ? (
                              <MailOpen className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Mail className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${
                          notification.read ? 'text-gray-600' : 'text-gray-800 font-medium'
                        }`} data-testid={`notification-message-${notification.id}`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;