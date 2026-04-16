import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--success-bg': '#f0fdf4',
                    '--success-text': '#15803d',
                    '--success-border': '#86efac',
                    '--error-bg': '#fef2f2',
                    '--error-text': '#b91c1c',
                    '--error-border': '#fca5a5',
                    '--warning-bg': '#fff7ed',
                    '--warning-text': '#c2410c',
                    '--warning-border': '#fdba74',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
