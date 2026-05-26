interface LanguageBadgeProps {
  language: string | null;
}

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  JavaScript: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/25',
  Python: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25',
  Rust: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25',
  Go: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  Java: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25',
  Vue: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  Svelte: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25',
  HTML: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25',
  CSS: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/25',
  Ruby: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25',
  PHP: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
  C: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/25',
  'C++': 'bg-pink-600/15 text-pink-700 dark:text-pink-300 border-pink-600/25',
  'C#': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
  Shell: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/25',
  Dart: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25',
  Kotlin: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25',
  Swift: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/25',
};

export default function LanguageBadge({ language }: LanguageBadgeProps) {
  if (!language) return null;

  const colorClass = languageColors[language] || 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {language}
    </span>
  );
}
