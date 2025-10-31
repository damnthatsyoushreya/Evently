import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Calendar, MapPin, Users, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // -----------------------------
  // Google Calendar & Share Functions
  // -----------------------------
  const formatDateForCalendar = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const addToCalendar = (event: any) => {
    const start = formatDateForCalendar(event.event_date);
    const endDate = new Date(new Date(event.event_date).getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const end = formatDateForCalendar(endDate);

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${start}/${end}&details=${encodeURIComponent(
      event.description
    )}&location=${encodeURIComponent(event.location)}`;

    window.open(calendarUrl, "_blank");
  };

  const shareEvent = async (event: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: "Check out this event on Evently!",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      toast.info("Sharing is supported on mobile browsers only!");
    }
  };

  // -----------------------------
  // Auth & Fetching
  // -----------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id, session]);

  const fetchEventDetails = async () => {
    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventData) {
      setEvent(eventData);
      setIsOrganizer(session?.user?.id === eventData.organizer_id);

      const { count } = await supabase
        .from("rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", id);
      setRsvpCount(count || 0);

      if (session) {
        const { data: rsvpData } = await supabase
          .from("rsvps")
          .select("*")
          .eq("event_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();
        setHasRsvped(!!rsvpData);
      }
    }
    setLoading(false);
  };

  const handleRSVP = async () => {
    if (!session) {
      toast.error("Please sign in to RSVP");
      navigate("/auth");
      return;
    }

    try {
      if (hasRsvped) {
        await supabase.from("rsvps").delete().eq("event_id", id).eq("user_id", session.user.id);
        toast.success("RSVP cancelled");
        setHasRsvped(false);
        setRsvpCount(rsvpCount - 1);
      } else {
        await supabase.from("rsvps").insert({ event_id: id, user_id: session.user.id });
        toast.success("RSVP confirmed! See you there!");
        setHasRsvped(true);
        setRsvpCount(rsvpCount + 1);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await supabase.from("events").delete().eq("id", id);
      toast.success("Event deleted successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // -----------------------------
  // Loading & Error States
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Event not found</p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/events">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video overflow-hidden rounded-xl bg-muted">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <Calendar className="w-24 h-24 text-primary/40" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <Badge className="mb-2 capitalize">{event.category}</Badge>
                  <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                </div>
                {isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-event/${event.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>

                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              <div className="prose prose-gray max-w-none">
                <p className="text-lg text-muted-foreground">{event.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Event Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.event_date), "PPP 'at' p")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p className="text-sm text-muted-foreground">
                      {rsvpCount} {rsvpCount === 1 ? "person" : "people"} attending
                    </p>
                  </div>
                </div>

                {!isOrganizer && (
                  <>
                    <Button
                      className="w-full"
                      variant={hasRsvped ? "outline" : "gradient"}
                      onClick={handleRSVP}
                    >
                      {hasRsvped ? "Cancel RSVP" : "RSVP to Event"}
                    </Button>

                    {/* Add to Google Calendar */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addToCalendar(event)}
                      title="Opens in Google Calendar"
                    >
                      📅 Add to Google Calendar
                    </Button>

                    {/* Share Event */}
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => shareEvent(event)}
                    >
                      🔗 Share Event
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
