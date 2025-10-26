'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSelfReport } from '@/lib/actions/self-report';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const schema = z.object({
  mood: z.string().min(1, 'Mood is required'),
  energy: z.coerce.number().min(1).max(10),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  userId: string;
}

export default function SelfReportForm({ userId }: Props) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mood: '',
      energy: 5,
      notes: '',
    },
  });
  const [pending, startTransition] = useTransition();

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const { success, message } = await createSelfReport({ ...values, userId });
      if (success) {
        toast({ title: 'Report submitted', description: 'Thanks for checking in today.' });
        reset();
      } else {
        toast({ title: 'Unable to submit', description: message, variant: 'destructive' });
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="mood">
          Mood
        </label>
        <Input id="mood" placeholder="Optimistic" {...register('mood')} />
        {errors.mood && <p className="text-sm text-destructive">{errors.mood.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="energy">
          Energy (1-10)
        </label>
        <Input id="energy" type="number" min={1} max={10} {...register('energy')} />
        {errors.energy && <p className="text-sm text-destructive">{errors.energy.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="notes">
          Mission notes
        </label>
        <Textarea id="notes" rows={4} placeholder="What&apos;s top of mind?" {...register('notes')} />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Submitting…' : 'Submit self-report'}
      </Button>
    </form>
  );
}
