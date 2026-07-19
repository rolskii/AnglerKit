import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  const toggle = (checked) => {
    const next = checked ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', checked);
    try {
      localStorage.setItem('theme', next);
    } catch {}
    setIsDark(checked);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
        <span className="text-sm font-medium">{isDark ? 'Dark' : 'Light'} Mode</span>
      </div>
      <Switch checked={isDark} onCheckedChange={toggle} />
    </div>
  );
}