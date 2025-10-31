import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define allowed event categories
type EventCategory =
  | "workshop"
  | "webinar"
  | "hackathon"
  | "conference"
  | "meetup"
  | "social"
  | "other";

interface EventForm {
  title: string;
  description: string;
  location: string;
  category: EventCategory;
  event_date: string;
  image_url: string;
}

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    location: "",
    category: "workshop",
    event_date: "",
    image_url: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) {
        toast.error("Error loading event");
      } else if (data) {
        setForm({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          category: (data.category as EventCategory) || "workshop",
          event_date: data.event_date || "",
          image_url: data.image_url || "",
        });
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("events")
      .update({
        title: form.title,
        description: form.description,
        location: form.location,
        category: form.category as EventCategory, // ✅ Fixed TypeScript issue here
        event_date: form.event_date,
        image_url: form.image_url,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update event");
      console.error(error);
    } else {
      toast.success("✅ Event updated successfully!");
      navigate(`/events/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-semibold mb-6">Edit Event</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Event Title"
            required
          />
          <Textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Event Description"
            required
          />
          <Input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
          />

          {/* ✅ Dropdown for category (prevents invalid values) */}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded-md p-2 bg-background text-foreground"
            required
          >
            <option value="workshop">Workshop</option>
            <option value="webinar">Webinar</option>
            <option value="hackathon">Hackathon</option>
            <option value="conference">Conference</option>
            <option value="meetup">Meetup</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>

          <Input
            type="date"
            name="event_date"
            value={form.event_date?.split("T")[0] || ""}
            onChange={handleChange}
          />
          <Input
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="Image URL (optional)"
          />

          <Button type="submit" variant="gradient" className="w-full">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
