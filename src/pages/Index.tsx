import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export default function Index() {
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(6);

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
        setFeaturedEvents(eventsWithRsvpCount);
      }
      setLoading(false);
    };

    fetchFeaturedEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Discover Amazing Events
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Connect Through{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Events
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Create, discover, and attend events that matter. Join a community of passionate event-goers and organizers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" variant="gradient" asChild>
                  <Link to="/events">
                    Browse Events
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-8">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl">500+</div>
                    <div className="text-sm text-muted-foreground">Events</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl">10K+</div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt="Event networking"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">
              Don't miss out on these exciting events
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/events">
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events found. Create one to get started!</p>
            <Button className="mt-4" asChild>
              <Link to="/create-event">Create Event</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
