import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    category: string;
    image_url: string | null;
    rsvp_count?: number;
  };
}

export const EventCard = ({ event }: EventCardProps) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      workshop: "bg-primary/10 text-primary border-primary/20",
      webinar: "bg-accent/10 text-accent border-accent/20",
      hackathon: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      conference: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      meetup: "bg-green-500/10 text-green-500 border-green-500/20",
      social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      other: "bg-muted text-muted-foreground border-muted",
    };
    return colors[category] || colors.other;
  };

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        <div className="aspect-video overflow-hidden bg-muted">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Calendar className="w-16 h-16 text-primary/40" />
            </div>
          )}
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="outline" className={getCategoryColor(event.category)}>
              {event.category}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {event.description}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(event.event_date), "PPP 'at' p")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{event.rsvp_count || 0} attending</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
