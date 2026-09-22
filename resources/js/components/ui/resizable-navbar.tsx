import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { IconMenu2, IconX } from '@tabler/icons-react';
import {
    AnimatePresence,
    motion,
    useMotionValueEvent,
    useScroll,
} from 'motion/react';
import React, { useState } from 'react';

type NavbarTone = 'light' | 'dark';

interface NavbarProps {
    children: React.ReactNode;
    className?: string;
    overlay?: boolean;
    tone?: NavbarTone;
}

interface NavBodyProps {
    children: React.ReactNode;
    className?: string;
    overlay?: boolean;
    visible?: boolean;
    tone?: NavbarTone;
}

interface NavItemsProps {
    items: {
        name: string;
        link: string;
    }[];
    className?: string;
    onItemClick?: () => void;
    activeLink?: string;
    overlay?: boolean;
    visible?: boolean;
    tone?: NavbarTone;
}

interface MobileNavProps {
    children: React.ReactNode;
    className?: string;
    overlay?: boolean;
    visible?: boolean;
    tone?: NavbarTone;
}

interface MobileNavHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface MobileNavMenuProps {
    children: React.ReactNode;
    className?: string;
    isOpen: boolean;
}

export const Navbar = ({
    children,
    className,
    overlay = false,
    tone = 'dark',
}: NavbarProps) => {
    const { scrollY } = useScroll();
    const [visible, setVisible] = useState(false);

    useMotionValueEvent(scrollY, 'change', (current) => {
        setVisible(current > 100);
    });

    return (
        <motion.div
            animate={{ y: visible ? 8 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={cn(
                'inset-x-0 z-40 w-full px-4',
                overlay ? 'fixed top-0' : 'sticky top-3',
                className,
            )}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(
                          child as React.ReactElement<{
                              visible?: boolean;
                              overlay?: boolean;
                              tone?: NavbarTone;
                          }>,
                          { visible, overlay, tone },
                      )
                    : child,
            )}
        </motion.div>
    );
};

export const NavBody = ({
    children,
    className,
    overlay = false,
    visible = false,
}: NavBodyProps) => {
    const transparent = overlay && !visible;

    return (
        <motion.div
            animate={{
                backdropFilter: transparent
                    ? 'blur(0px)'
                    : visible
                      ? 'blur(12px)'
                      : 'blur(5px)',
                boxShadow: transparent
                    ? 'none'
                    : visible
                      ? '0 16px 52px rgba(15, 76, 148, 0.12)'
                      : '0 8px 24px rgba(15, 76, 148, 0.06)',
                width: visible ? '88%' : '100%',
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 50 }}
            className={cn(
                'relative z-[60] mx-auto hidden min-h-[64px] w-full max-w-7xl flex-row items-center justify-between self-start px-5 py-3 lg:flex lg:px-6',
                transparent
                    ? 'rounded-none border-transparent bg-transparent'
                    : 'rounded-full border border-primary-100 bg-white/90',
                visible && 'bg-white/95',
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const NavItems = ({
    items,
    className,
    onItemClick,
    activeLink,
    overlay = false,
    visible = false,
    tone = 'dark',
}: NavItemsProps) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const transparent = overlay && !visible;
    const darkOverlay = transparent && tone === 'dark';

    return (
        <motion.nav
            onMouseLeave={() => setHovered(null)}
            aria-label="Navigasi utama"
            className={cn(
                'absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-1 text-sm font-normal transition duration-200 lg:flex',
                darkOverlay ? 'text-white/85' : 'text-text/70',
                className,
            )}
        >
            {items.map((item, index) => {
                const isActive =
                    activeLink !== undefined &&
                    (activeLink === item.link ||
                        activeLink.startsWith(`${item.link}/`));

                return (
                    <Link
                        key={`link-${index}`}
                        href={item.link}
                        onMouseEnter={() => setHovered(index)}
                        onClick={onItemClick}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                            'relative inline-flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                                isActive
                                ? darkOverlay
                                    ? 'text-white'
                                    : 'font-semibold text-white'
                                : darkOverlay
                                  ? 'text-white/80 hover:text-white'
                                  : 'text-text/70 hover:text-heading',
                        )}
                    >
                        {hovered === index && (
                            <motion.span
                                layoutId="resizable-navbar-hovered"
                                className={cn(
                                    'absolute inset-0 rounded-full',
                                    darkOverlay
                                        ? 'bg-white/15'
                                        : isActive
                                          ? 'bg-primary'
                                          : 'bg-primary-50',
                                )}
                            />
                        )}
                        {isActive && hovered !== index && (
                            <span
                                className={cn(
                                    'absolute inset-0 rounded-full',
                                    darkOverlay
                                        ? 'bg-white/15'
                                        : 'bg-primary',
                                )}
                            />
                        )}
                        <span className="relative z-20">{item.name}</span>
                    </Link>
                );
            })}
        </motion.nav>
    );
};

export const MobileNav = ({
    children,
    className,
    overlay = false,
    visible = false,
}: MobileNavProps) => {
    const transparent = overlay && !visible;

    return (
        <motion.div
            animate={{
                backdropFilter: transparent
                    ? 'blur(0px)'
                    : visible
                      ? 'blur(10px)'
                      : 'blur(5px)',
                boxShadow: transparent
                    ? 'none'
                    : visible
                      ? '0 16px 42px rgba(15, 76, 148, 0.12)'
                      : '0 8px 24px rgba(15, 76, 148, 0.06)',
                width: visible ? '92%' : '100%',
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 50 }}
            className={cn(
                'relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between overflow-visible px-3 py-2 lg:hidden',
                transparent
                    ? 'rounded-none border-transparent bg-transparent'
                    : 'rounded-full border border-primary-100 bg-white/90',
                visible && 'bg-white/95',
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
    return (
        <div
            className={cn(
                'flex w-full flex-row items-center justify-between',
                className,
            )}
        >
            {children}
        </div>
    );
};

export const MobileNavMenu = ({
    children,
    className,
    isOpen,
}: MobileNavMenuProps) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={cn(
                        'absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start justify-start gap-2 rounded-2xl border border-primary-100 bg-white px-4 py-5 shadow-xl shadow-primary-900/10',
                        className,
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const MobileNavToggle = ({
    isOpen,
    onClick,
    overlay = false,
    tone = 'dark',
}: {
    isOpen: boolean;
    onClick: () => void;
    overlay?: boolean;
    tone?: NavbarTone;
}) => {
    const darkOverlay = overlay && tone === 'dark';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={isOpen}
            className={cn(
                'relative z-50 flex size-11 shrink-0 items-center justify-center rounded-full transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                darkOverlay
                    ? 'bg-white/15 text-white hover:bg-white/25'
                    : 'bg-primary-50 text-heading hover:bg-primary-100',
            )}
        >
            {isOpen ? (
                <IconX className="size-5" aria-hidden="true" />
            ) : (
                <IconMenu2 className="size-5" aria-hidden="true" />
            )}
        </button>
    );
};

export const NavbarLogo = () => {
  return (
    <a
      href="#"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
    >
      <img
        src="https://assets.aceternity.com/logo-dark.png"
        alt="logo"
        width={30}
        height={30}
      />
      <span className="font-medium text-black dark:text-white">Startup</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md bg-white button bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none dark:text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
