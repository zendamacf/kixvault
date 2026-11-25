import { Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMode } from './mode';
import { ThemeSwatch } from './theme-swatch';
import { DEFAULT_THEME, MODE_PREFERENCES, type ModePreference, THEME_IDS, THEMES } from './themes';

/** Light/dark mode and sneaker colorway picker for the app header. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useMode();
  const active = theme && THEME_IDS.includes(theme) ? theme : DEFAULT_THEME;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('theme.change')}
          className="text-chrome-foreground hover:bg-chrome-foreground/10 hover:text-chrome-foreground focus-visible:ring-brand dark:hover:bg-chrome-foreground/10"
        >
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>{t('theme.mode.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as ModePreference)}
        >
          {MODE_PREFERENCES.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>
              {t(`theme.mode.${item}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('layout.mobileMenu.colorway')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={active}
          onValueChange={setTheme}
          className="flex flex-col gap-1.5"
        >
          {THEMES.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id} className="py-2">
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                {t(`theme.names.${item.id}`)}
                <ThemeSwatch id={item.id} />
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
