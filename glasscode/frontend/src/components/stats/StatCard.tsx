'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';
import AnimatedCounter from './AnimatedCounter';

interface StatCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    description?: string;
    prefix?: string;
    suffix?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const colorClasses = {
    blue: {
        bg: 'from-blue-500 via-cyan-500 to-blue-600',
        bgDark: 'dark:from-blue-400 dark:via-cyan-400 dark:to-blue-500',
        icon: 'text-fg',
        iconBg: 'from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400',
        border: 'border-border',
        shadow: '',
        glow: ''
    },
    green: {
        bg: 'from-green-500 via-emerald-500 to-green-600',
        bgDark: 'dark:from-green-400 dark:via-emerald-400 dark:to-green-500',
        icon: 'text-fg',
        iconBg: 'from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400',
        border: 'border-border',
        shadow: '',
        glow: ''
    },
    purple: {
        bg: 'from-purple-500 via-violet-500 to-purple-600',
        bgDark: 'dark:from-purple-400 dark:via-violet-400 dark:to-purple-500',
        icon: 'text-fg',
        iconBg: 'from-purple-500 to-violet-500 dark:from-purple-400 dark:to-violet-400',
        border: 'border-border',
        shadow: '',
        glow: ''
    },
    orange: {
        bg: 'from-orange-500 via-amber-500 to-orange-600',
        bgDark: 'dark:from-orange-400 dark:via-amber-400 dark:to-orange-500',
        icon: 'text-fg',
        iconBg: 'from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400',
        border: 'border-border',
        shadow: '',
        glow: ''
    },
    pink: {
        bg: 'from-pink-500 via-rose-500 to-pink-600',
        bgDark: 'dark:from-pink-400 dark:via-rose-400 dark:to-pink-500',
        icon: 'text-fg',
        iconBg: 'from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400',
        border: 'border-border',
        shadow: '',
        glow: ''
    },
    indigo: {
        bg: 'from-indigo-500 via-blue-500 to-indigo-600',
        bgDark: 'dark:from-indigo-400 dark:via-blue-400 dark:to-indigo-500',
        icon: 'text-fg',
        iconBg: 'from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400',
        border: 'border-border',
        shadow: '',
        glow: ''
    }
};

export default function StatCard({
    title,
    value,
    icon,
    description,
    prefix = '',
    suffix = '',
    color = 'blue',
    trend
}: StatCardProps) {
    const colors = colorClasses[color];

    let sizedIcon: ReactNode = icon;
    if (isValidElement(icon)) {
        const iconProps = icon.props as Record<string, unknown>;
        const existingClassName = (iconProps?.className as string) ?? '';
        const mergedClassName = `${existingClassName} w-12 h-12`.trim();
        const extraProps: Record<string, unknown> = { className: mergedClassName };
        if ('size' in iconProps) {
            extraProps.size = 48;
        }
        sizedIcon = cloneElement(icon as React.ReactElement, extraProps);
    }

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl backdrop-blur-md bg-surface-alt
                border border-border
                transition-all duration-500 hover:shadow-xl hover:scale-105
                group glass-card h-40 min-h-[10rem]
            `}
        >
            <div
                className={`
                    absolute inset-0 bg-gradient-to-br ${colors.bg} ${colors.bgDark}
                    opacity-60 dark:opacity-40
                    group-hover:opacity-80 dark:group-hover:opacity-60
                    transition-all duration-500
                    animate-pulse group-hover:animate-none
                `}
            />
            <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                           translate-x-[-100%] group-hover:translate-x-[100%]
                           transition-transform duration-1000 ease-in-out"
            />
            <div className="absolute top-4 right-4 z-10">
                <div
                    className={`
                        w-16 h-16 rounded-lg bg-gradient-to-br ${colors.iconBg}
                        backdrop-blur-sm border border-border
                        flex items-center justify-center
                        shadow-lg transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-3
                    `}
                >
                    <div className={`w-12 h-12 text-primary-fg transition-colors duration-300 flex items-center justify-center`}>
                        {sizedIcon}
                    </div>
                </div>
            </div>
            {trend && (
                <div className="absolute top-4 left-4 z-10">
                    <div
                        className={`
                            flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium
                            backdrop-blur-sm border border-border
                            transition-all duration-300 hover:scale-105
                            ${trend.isPositive ? 'bg-surface-alt text-success' : 'bg-surface-alt text-danger'}
                        `}
                    >
                        <span aria-hidden="true">{trend.isPositive ? '↗' : '↘'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                </div>
            )}
            <div className="absolute bottom-4 left-4">
                <div className="mb-1">
                    <div
                        className="text-3xl font-bold text-fg flex items-baseline
                                   drop-shadow-lg transition-all duration-300 group-hover:scale-105"
                    >
                        <span className="text-lg text-muted mr-1">{prefix}</span>
                        <AnimatedCounter end={value} />
                        <span className="text-lg text-muted ml-1">{suffix}</span>
                    </div>
                </div>
                <h3
                    className="text-sm font-medium text-fg mb-0.5
                               drop-shadow transition-colors duration-300"
                >
                    {title}
                </h3>
                {description && (
                    <p
                        className="text-xs text-muted drop-shadow
                                   transition-colors duration-300"
                    >
                        {description}
                    </p>
                )}
            </div>
            <div
                className={`
                    absolute inset-0 rounded-xl border-2 border-transparent
                    bg-gradient-to-r from-transparent via-white/30 to-transparent
                    opacity-0 group-hover:opacity-40 dark:group-hover:opacity-20
                    transition-all duration-500
                    animate-pulse group-hover:animate-none
                `}
            />
            <div
                className="absolute top-0 left-0 right-0 h-1/2
                           bg-gradient-to-b from-white/10 to-transparent
                           rounded-t-xl opacity-50 dark:opacity-30"
            />
        </div>
    );
}
