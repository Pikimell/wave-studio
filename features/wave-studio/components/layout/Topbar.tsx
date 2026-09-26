import { Moon, Sun } from 'lucide-react';

type TopbarProps = {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
};

export const Topbar = ({ theme, onThemeToggle }: TopbarProps) => {
  const dark = theme === 'dark';

  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Wave Studio — головна">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <path d="M0 16c6-10 12-10 20 0s14 10 20 0v24H0Z" fill="#7cb2ed" />
            <path d="M0 24c6-10 12-10 20 0s14 10 20 0v16H0Z" fill="#357bd0" />
          </svg>
        </span>
        <span>
          wave<span className="brand-light">studio</span>
          <span className="brand-dot">.</span>
        </span>
      </a>
      <div className="topbar-right">
        <span className="topbar-caption">Простір для ваших ідей</span>
        <button
          className="theme-toggle"
          type="button"
          aria-label={dark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
          aria-pressed={dark}
          onClick={onThemeToggle}
        >
          {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          <span className="theme-label">{dark ? 'Світла тема' : 'Темна тема'}</span>
        </button>
        <span className="topbar-divider" />
        <span className="topbar-badge">
          <span className="status-dot" /> Редактор
        </span>
      </div>
    </header>
  );
};
