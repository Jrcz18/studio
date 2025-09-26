
'use client';

import type { Reminder } from '@/lib/types';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function AddReminderDialog({
  children,
  open,
  onOpenChange,
  onAddReminder,
}: {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReminder: (newReminder: Omit<Reminder, 'id' | 'createdAt' | 'status' | 'userId'>) => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Reminder['category']>('other');
    const [priority, setPriority] = useState<Reminder['priority']>('medium');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('medium');
      setDueTime('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newReminderData = {
      title,
      description,
      category,
      priority,
      dueDate,
      dueTime,
    };
    onAddReminder(newReminderData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Reminder</DialogTitle>
        </DialogHeader>
        <form
          id="reminderForm"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminderTitle" className="text-right">
              Title
            </Label>
            <Input
              id="reminderTitle"
              className="col-span-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminderDescription" className="text-right">
              Description
            </Label>
            <Textarea
              id="reminderDescription"
              className="col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminderCategory" className="text-right">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Reminder['category'])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminderPriority" className="text-right">
              Priority
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Reminder['priority'])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminderDate" className="text-right">
              Due Date
            </Label>
            <Input
              id="reminderDate"
              type="date"
              className="col-span-3"
              value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminderTime" className="text-right">
              Time
            </Label>
            <Input
              id="reminderTime"
              type="time"
              className="col-span-3"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add Reminder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
