
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RemindersList } from '@/components/dashboard/reminders/reminders-list';
import { AddReminderDialog } from '@/components/dashboard/reminders/add-reminder-dialog';
import type { Reminder } from '@/lib/types';
import { getReminders, addReminder as addReminderService, updateReminder as updateReminderService, deleteReminder as deleteReminderService } from '@/services/reminders';
import { useUIContext } from '@/hooks/use-ui-context';


export default function RemindersPage() {
  const { isAddReminderOpen, setIsAddReminderOpen } = useUIContext();
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchReminders() {
      const remindersData = await getReminders();
      setReminders(remindersData);
      setLoading(false);
    }
    fetchReminders();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddReminderOpen(true);
    }
  }, [searchParams, setIsAddReminderOpen]);

  const addReminder = async (newReminderData: Omit<Reminder, 'id' | 'createdAt' | 'status'>) => {
    const newReminder: Omit<Reminder, 'id'> = {
      ...newReminderData,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const { id } = await addReminderService(newReminder);
    setReminders((prev) => [...prev, { ...newReminder, id }]);
  };

  const updateReminderStatus = async (reminderId: string, status: 'pending' | 'completed') => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      const updatedReminder = { ...reminder, status };
      await updateReminderService(updatedReminder);
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? updatedReminder : r))
      );
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
        await deleteReminderService(reminderId);
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading reminders...</div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reminders</h2>
          <p className="text-sm text-gray-500">Task management system</p>
        </div>
        <AddReminderDialog
          open={isAddReminderOpen}
          onOpenChange={setIsAddReminderOpen}
          onAddReminder={addReminder}
        >
          <button
            onClick={() => setIsAddReminderOpen(true)}
            className="prime-button px-4 py-2 text-sm"
          >
            + Add
          </button>
        </AddReminderDialog>
      </div>
      <RemindersList 
        reminders={reminders}
        onUpdateStatus={updateReminderStatus}
        onDelete={deleteReminder}
      />
    </div>
  );
}
