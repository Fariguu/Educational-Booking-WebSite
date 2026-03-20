'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(defaultQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      if (query.trim()) {
        router.push(`/cerca?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push(`/cerca`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-lg mx-auto mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca professore o materia..."
          className="pl-10 h-12 bg-white text-base shadow-sm"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cerca'}
      </Button>
    </form>
  );
}
