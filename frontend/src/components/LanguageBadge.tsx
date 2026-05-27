interface LanguageBadgeProps {
  language: string | null;
  size?: 'sm' | 'md';
}

const languageColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  TypeScript: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  JavaScript: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
  Python: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', dot: 'bg-green-500' },
  Rust: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  Go: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
  Java: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
  Vue: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  Svelte: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  HTML: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  CSS: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500' },
  Ruby: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-300', border: 'border-red-500/20', dot: 'bg-red-500' },
  PHP: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
  C: { bg: 'bg-gray-500/10', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-500/20', dot: 'bg-gray-500' },
  'C++': { bg: 'bg-pink-600/10', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-600/20', dot: 'bg-pink-600' },
  'C#': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  Shell: { bg: 'bg-green-500/10', text: 'text-green-700 dark:text-green-300', border: 'border-green-500/20', dot: 'bg-green-500' },
  Dart: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-500' },
  Kotlin: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20', dot: 'bg-violet-500' },
  Swift: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-300', border: 'border-orange-500/20', dot: 'bg-orange-500' },
};

export default function LanguageBadge({ language, size = 'sm' }: LanguageBadgeProps) {
  if (!language) return null;

  const colors = languageColors[language] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} transition-colors hover:opacity-80`}
    >
      <span className={`rounded-full ${colors.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {language}
    </span>
  );
}
