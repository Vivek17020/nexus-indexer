import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Users, MapPin, Clock } from 'lucide-react';

interface GroupSessionCreatorProps {
  eventId: string;
  eventName: string;
  onSessionCreated: (sessionId: string) => void;
  onCancel: () => void;
  isCreating: boolean;
}

export function GroupSessionCreator({
  eventId,
  eventName,
  onSessionCreated,
  onCancel,
  isCreating
}: GroupSessionCreatorProps) {
  const [maxParticipants, setMaxParticipants] = useState([6]);
  const [minParticipants, setMinParticipants] = useState([3]);
  const [location, setLocation] = useState('');

  const handleCreate = () => {
    onSessionCreated(eventId);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Create Group Session
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set up a group verification session for {eventName}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Min Participants */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Minimum Participants: {minParticipants[0]}
          </Label>
          <Slider
            value={minParticipants}
            onValueChange={setMinParticipants}
            min={3}
            max={8}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Minimum number of people required to generate proof
          </p>
        </div>

        {/* Max Participants */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Maximum Participants: {maxParticipants[0]}
          </Label>
          <Slider
            value={maxParticipants}
            onValueChange={setMaxParticipants}
            min={Math.max(3, minParticipants[0])}
            max={20}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of people who can join this session
          </p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            Location (Optional)
          </Label>
          <Input
            id="location"
            placeholder="e.g., Conference Hall A, Booth #42"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Session Info */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            Session Duration
          </div>
          <p className="text-sm font-medium">30 minutes</p>
          <p className="text-xs text-muted-foreground mt-1">
            Session will automatically expire after 30 minutes
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}