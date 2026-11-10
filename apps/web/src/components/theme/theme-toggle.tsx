import { Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_THEME, THEME_IDS, THEMES } from './themes';

/** Sneaker colorway picker for the app header. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
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
        <DropdownMenuRadioGroup
          value={active}
          onValueChange={setTheme}
          className="flex flex-col gap-1.5"
        >
          {THEMES.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id} className="py-2">
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                {t(`theme.names.${item.id}`)}
                <span
                  aria-hidden="true"
                  className="flex h-1.5 overflow-hidden rounded-full ring-1 ring-foreground/25"
                >
                  {item.swatches.map((color) => (
                    <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                  ))}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
