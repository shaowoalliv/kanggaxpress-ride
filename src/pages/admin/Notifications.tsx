import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface NotificationLog {
  id: string;
  user_id: string;
  recipient_email: string;
  notification_type: string;
  subject: string;
  status: string;
  delivery_status: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function Notifications() {
  const { isAdmin } = useAdminAuth();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadNotifications();
    }
  }, [isAdmin]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p>Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Notification History - KanggaXpress Admin</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification History</h1>
          <p className="text-muted-foreground mt-2">
            Track all sent email notifications and their delivery status
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No notifications sent yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {format(new Date(notification.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{notification.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {notification.notification_type.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {notification.subject}
                      </TableCell>
                      <TableCell>
                        <span className={getStatusColor(notification.delivery_status || notification.status)}>
                          {(notification.delivery_status || notification.status).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {notification.error_message ? (
                          <span className="text-red-600 text-xs">
                            {notification.error_message}
                          </span>
                        ) : notification.metadata?.driver_name ? (
                          <span className="text-xs text-muted-foreground">
                            Driver: {notification.metadata.driver_name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
