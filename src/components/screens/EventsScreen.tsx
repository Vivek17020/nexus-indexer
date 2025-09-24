import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, Clock, Search, Filter, Zap, UserPlus } from "lucide-react";
import eventsImage from "@/assets/events-icon.jpg";
import { useZKIdentity } from "@/hooks/useZKIdentity";
import { GroupSession } from "@/components/GroupSession";

export default function EventsScreen() {
  const { generateEventCredential, isGeneratingProof, submitGroupProofToBlockchain } = useZKIdentity();
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showGroupSession, setShowGroupSession] = useState(false);

  // Mock events data
  const events = [
    {
      id: "1",
      name: "ETH Denver 2025",
      description: "The largest Ethereum event in the world returns to Denver",
      location: "Denver, CO",
      date: "Feb 28 - Mar 2, 2025",
      time: "9:00 AM MST",
      attendees: 4500,
      status: "upcoming",
      category: "Conference",
      requiresProof: true
    },
    {
      id: "2",
      name: "ZK Summit 11",
      description: "The premier zero-knowledge proof research conference",
      location: "Athens, Greece", 
      date: "Apr 10-12, 2025",
      time: "10:00 AM EEST",
      attendees: 800,
      status: "registration",
      category: "Research",
      requiresProof: true
    },
    {
      id: "3",
      name: "Privacy Tech Meetup",
      description: "Monthly meetup for privacy technology enthusiasts",
      location: "San Francisco, CA",
      date: "Dec 15, 2024",
      time: "6:00 PM PST",
      attendees: 150,
      status: "open",
      category: "Meetup",
      requiresProof: false
    },
    {
      id: "4",
      name: "Cryptography Workshop",
      description: "Hands-on workshop on modern cryptographic protocols",
      location: "Online",
      date: "Jan 20, 2025",
      time: "2:00 PM UTC",
      attendees: 300,
      status: "upcoming",
      category: "Workshop",
      requiresProof: true
    }
  ];

  const handleJoinEvent = async (event: typeof events[0]) => {
    if (joinedEvents.has(event.id) || isGeneratingProof) return;

    try {
      await generateEventCredential(event.id, event.name, {
        location: event.location,
        attendeeCount: event.attendees
      });
      
      setJoinedEvents(prev => new Set([...prev, event.id]));
    } catch (error) {
      console.error('Failed to generate credential:', error);
    }
  };

  const handleGroupProofGenerated = async (groupProof: any) => {
    try {
      await submitGroupProofToBlockchain(groupProof);
      console.log('Group proof submitted successfully');
    } catch (error) {
      console.error('Failed to submit group proof:', error);
    }
  };

  const handleGroupSession = (eventId: string, eventName: string) => {
    setSelectedEvent(eventId);
    setShowGroupSession(true);
  };

  if (showGroupSession && selectedEvent) {
    const event = events.find(e => e.id === selectedEvent);
    return (
      <div className="p-6 pb-24 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Group Verification</h1>
            <p className="text-muted-foreground">{event?.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowGroupSession(false)}
          >
            Back to Events
          </Button>
        </div>
        
        <GroupSession
          eventId={selectedEvent}
          eventName={event?.name || 'Unknown Event'}
          onGroupProofGenerated={handleGroupProofGenerated}
        />
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">Discover privacy-focused events near you</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            All
          </Button>
          <Button variant="outline" size="sm">
            Upcoming
          </Button>
          <Button variant="outline" size="sm">
            Online
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    {event.requiresProof && (
                      <Badge variant="outline" className="text-xs border-primary text-primary">
                        ZK Proof
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                </div>
                <Badge 
                  variant={event.status === 'open' ? 'default' : 'secondary'}
                  className={
                    event.status === 'open' 
                      ? 'bg-success hover:bg-success/80' 
                      : event.status === 'registration'
                      ? 'bg-primary hover:bg-primary/80'
                      : 'bg-muted hover:bg-muted/80'
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{event.attendees} attendees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{event.time}</span>
                </div>
              </div>

                <div className="flex gap-2 mt-4">
                  {joinedEvents.has(event.id) ? (
                    <Badge variant="secondary" className="bg-success/20 text-success border-success/30 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      ZK Proof Generated
                    </Badge>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleJoinEvent(event)}
                        disabled={isGeneratingProof || event.status === 'upcoming'}
                      >
                        {isGeneratingProof ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 mr-1" />
                            Generate Proof
                          </>
                        )}
                      </Button>
                      
                      {event.requiresProof && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleGroupSession(event.id, event.name)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Group
                        </Button>
                      )}
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center space-y-4">
            <img 
              src={eventsImage} 
              alt="No events found" 
              className="w-32 h-32 mx-auto rounded-xl opacity-60"
            />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No events found</h3>
              <p className="text-muted-foreground">
                Check back later for new privacy-focused events
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}