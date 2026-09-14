import { useCollection } from './useCollection';
import type { Reminder, ReminderCompletion } from '../types/models';
import { useMemo } from 'react';

export function useReminders() {
  return useCollection<Reminder>('reminders', [{ column: 'active', value: true }]);
}

export function useReminderCompletion(reminderId: string | undefined, month: string) {
  const col = useCollection<ReminderCompletion>(
    'reminder_completions',
    reminderId ? [{ column: 'reminder_id', value: reminderId }, { column: 'month', value: month }] : []
  );
  const record = useMemo(() => col.rows[0] ?? null, [col.rows]);

  async function markDone() {
    if (!reminderId) return;
    return col.upsert({ ...(record ?? {}), reminder_id: reminderId, month, done: true }, 'reminder_id,month');
  }

  return { ...col, record, done: record?.done ?? false, markDone };
}
