import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Calendar, Plus, Users } from "lucide-react";

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session) return;

    // Fetch user's created events
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_id", session.user.id)
      .order("event_date", { ascending: true });

    if (events) {
      const eventsWithRsvpCount = await Promise.all(
        events.map(async (event) => {
          const { count } = await supabase
            .from("rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
          return { ...event, rsvp_count: count || 0 };
        })
      );
      setMyEvents(eventsWithRsvpCount);
    }

    // Fetch events user has RSVP'd to
    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("event_id")
      .eq("user_id", session.user.id);

    if (rsvps && rsvps.length > 0) {
      const eventIds = rsvps.map((rsvp) => rsvp.event_id);
      const { data: rsvpEvents } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (rsvpEvents) {
        const eventsWithRsvpCount = await Promise.all(
          rsvpEvents.map(async (event) => {
            const { count } = await supabase
              .from("rsvps")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);
            return { ...event, rsvp_count: count || 0 };
          })
        );
        setRsvpedEvents(eventsWithRsvpCount);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your events and RSVPs
            </p>
          </div>
          <Button variant="gradient" onClick={() => navigate("/create-event")}>
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Created</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myEvents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RSVPs Received</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myEvents.reduce((sum, event) => sum + (event.rsvp_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Attending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rsvpedEvents.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="my-events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
            <TabsTrigger value="attending">Attending</TabsTrigger>
          </TabsList>

          <TabsContent value="my-events">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : myEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't created any events yet
                </p>
                <Button onClick={() => navigate("/create-event")}>
                  Create Your First Event
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attending">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : rsvpedEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rsvpedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't RSVP'd to any events yet
                </p>
                <Button onClick={() => navigate("/events")}>
                  Browse Events
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
