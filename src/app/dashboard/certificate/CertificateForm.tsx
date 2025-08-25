import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertificateData } from '@/types/certificates';
import { assignMedalType } from '@/utils/certificateUtils';

interface CertificateFormProps {
  onSubmit: (data: CertificateData) => void;
  onExport: (format: 'png' | 'pdf') => void;
  isLoading?: boolean;
}

export function CertificateForm({ onSubmit, onExport, isLoading = false }: CertificateFormProps) {
  const [studentName, setStudentName] = useState('');
  const [rank, setRank] = useState<number>(1);
  const [testsAttempted, setTestsAttempted] = useState<number>(10);
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [medalType, setMedalType] = useState<'auto' | 'gold' | 'silver' | 'bronze' | 'participation'>('auto');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const medal = medalType === 'auto'
      ? assignMedalType(rank)
      : medalType as 'gold' | 'silver' | 'bronze' | 'participation';

    const data: CertificateData = {
      student: {
        id: Math.random().toString(36).substring(7),
        name: studentName,
        rank,
        testsAttempted,
        medalType: medal
      },
      event: {
        name: eventName,
        date: new Date(date)
      }
    };

    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank">Rank</Label>
              <Input
                id="rank"
                type="number"
                min="1"
                value={rank}
                onChange={(e) => setRank(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testsAttempted">Tests Attempted</Label>
              <Input
                id="testsAttempted"
                type="number"
                min="1"
                value={testsAttempted}
                onChange={(e) => setTestsAttempted(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medalType">Medal Type</Label>
              <Select value={medalType} onValueChange={(value: any) => setMedalType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (based on rank)</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Preview Certificate'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onExport('png')}
              disabled={isLoading || !studentName || !eventName}
            >
              Export as PNG
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onExport('pdf')}
              disabled={isLoading || !studentName || !eventName}
            >
              Export as PDF
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}