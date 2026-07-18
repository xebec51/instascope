import type { ThemePreference } from '../app/theme';

type ThemeToggleProps = {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
};

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle({ preference, onChange }: ThemeToggleProps) {
  return (
    <div className="theme-toggle" aria-label="Theme preference">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="theme-toggle__button"
          aria-pressed={preference === option.value}
          onClick={() => {
            onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
