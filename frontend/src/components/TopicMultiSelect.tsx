import { useState, useRef, useEffect, useMemo } from 'react';
import { IconX, IconChevronDown } from './Icons';

const MAX_VISIBLE_OPTIONS = 50;

interface TopicMultiSelectProps {
  topics: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function TopicMultiSelect({ topics, selected, onChange }: TopicMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = topics.length === 0;

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedSet = new Set(selected);
    return topics
      .filter((t) => !selectedSet.has(t) && (!q || t.toLowerCase().includes(q)))
      .slice(0, MAX_VISIBLE_OPTIONS);
  }, [topics, selected, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTopic = (topic: string) => {
    onChange([...selected, topic]);
    setQuery('');
    setHighlighted(0);
    inputRef.current?.focus();
  };

  const removeTopic = (topic: string) => {
    onChange(selected.filter((t) => t !== topic));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && options[highlighted]) addTopic(options[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      removeTopic(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className={`w-full bg-surface-2 border border-surface-3 rounded-lg px-2 py-1.5 pr-9 flex flex-wrap items-center gap-1.5 min-h-[44px] focus-within:ring-2 focus-within:ring-brand/50 focus-within:border-brand transition text-sm ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-text'}`}
      >
        {selected.map((topic) => (
          <span key={topic} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand/10 text-brand text-xs font-medium">
            {topic}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTopic(topic);
              }}
              className="hover:text-accent focus:outline-none focus:ring-1 focus:ring-brand/50 rounded"
              aria-label={`Rimuovi topic ${topic}`}
            >
              <IconX className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? (disabled ? 'Nessun topic disponibile' : 'Filtra per topic...') : ''}
          className="flex-1 min-w-[6rem] bg-transparent px-2 py-1 focus:outline-none text-primary placeholder:text-muted disabled:cursor-not-allowed"
          aria-label="Filtra per topic"
          role="combobox"
          aria-expanded={open}
          aria-controls="topic-options"
          aria-autocomplete="list"
        />
      </div>
      <div className="absolute right-3 top-3.5 pointer-events-none">
        <IconChevronDown className="w-4 h-4 text-muted" />
      </div>
      {open && !disabled && (
        <ul
          id="topic-options"
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-surface border border-surface-3 rounded-lg shadow-lg py-1 text-sm"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-muted">Nessun topic trovato</li>
          ) : (
            options.map((topic, i) => (
              <li
                key={topic}
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTopic(topic);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`px-3 py-2 cursor-pointer text-primary ${i === highlighted ? 'bg-brand/10 text-brand' : ''}`}
              >
                {topic}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
