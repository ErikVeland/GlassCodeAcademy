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
        icon: 'text-white dark:text-blue-100',
        iconBg: 'from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400',
        border: 'border-blue-300 dark:border-blue-400',
        shadow: 'shadow-blue-500 dark:shadow-blue-400',
        glow: 'shadow-blue-500 dark:shadow-blue-400'
    },
    green: {
        bg: 'from-green-500 via-emerald-500 to-green-600',
        bgDark: 'dark:from-green-400 dark:via-emerald-400 dark:to-green-500',
        icon: 'text-white dark:text-green-100',
        iconBg: 'from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400',
        border: 'border-green-300 dark:border-green-400',
        shadow: 'shadow-green-500 dark:shadow-green-400',
        glow: 'shadow-green-500 dark:shadow-green-400'
    },
    purple: {
        bg: 'from-purple-500 via-violet-500 to-purple-600',
        bgDark: 'dark:from-purple-400 dark:via-violet-400 dark:to-purple-500',
        icon: 'text-white dark:text-purple-100',
        iconBg: 'from-purple-500 to-violet-500 dark:from-purple-400 dark:to-violet-400',
        border: 'border-purple-300 dark:border-purple-400',
        shadow: 'shadow-purple-500 dark:shadow-purple-400',
        glow: 'shadow-purple-500 dark:shadow-purple-400'
    },
    orange: {
        bg: 'from-orange-500 via-amber-500 to-orange-600',
        bgDark: 'dark:from-orange-400 dark:via-amber-400 dark:to-orange-500',
        icon: 'text-white dark:text-orange-100',
        iconBg: 'from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400',
        border: 'border-orange-300 dark:border-orange-400',
        shadow: 'shadow-orange-500 dark:shadow-orange-400',
        glow: 'shadow-orange-500 dark:shadow-orange-400'
    },
    pink: {
        bg: 'from-pink-500 via-rose-500 to-pink-600',
        bgDark: 'dark:from-pink-400 dark:via-rose-400 dark:to-pink-500',
        icon: 'text-white dark:text-pink-100',
        iconBg: 'from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400',
        border: 'border-pink-300 dark:border-pink-400',
        shadow: 'shadow-pink-500 dark:shadow-pink-400',
        glow: 'shadow-pink-500 dark:shadow-pink-400'
    },
    indigo: {
        bg: 'from-indigo-500 via-blue-500 to-indigo-600',
        bgDark: 'dark:from-indigo-400 dark:via-blue-400 dark:to-indigo-500',
        icon: 'text-white dark:text-indigo-100',
        iconBg: 'from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400',
        border: 'border-indigo-300 dark:border-indigo-400',
        shadow: 'shadow-indigo-500 dark:shadow-indigo-400',
        glow: 'shadow-indigo-500 dark:shadow-indigo-400'
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
                relative overflow-hidden rounded-xl backdrop-blur-md bg-white/10 dark:bg-gray-900/20
                border ${colors.border} ${colors.shadow}
                transition-all duration-500 hover:shadow-xl hover:scale-105 hover:${colors.glow}
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
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        flex items-center justify-center
                        shadow-lg transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-3
                    `}
                >
                    <div className={`w-12 h-12 ${colors.icon} transition-colors duration-300 flex items-center justify-center`}>
                        {sizedIcon}
                    </div>
                </div>
            </div>
            {trend && (
                <div className="absolute top-4 left-4 z-10">
                    <div
                        className={`
                            flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium
                            backdrop-blur-sm border border-white/20 dark:border-white/10
                            transition-all duration-300 hover:scale-105
                            ${trend.isPositive
                                ? 'bg-green-500/20 text-green-100 dark:text-green-200 shadow-green-500/20'
                                : 'bg-red-500/20 text-red-100 dark:text-red-200 shadow-red-500/20'}
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
                        className="text-3xl font-bold text-white dark:text-gray-100 flex items-baseline
                                   drop-shadow-lg transition-all duration-300 group-hover:scale-105"
                    >
                        <span className="text-lg text-white/80 dark:text-gray-200/80 mr-1">{prefix}</span>
                        <AnimatedCounter end={value} />
                        <span className="text-lg text-white/80 dark:text-gray-200/80 ml-1">{suffix}</span>
                    </div>
                </div>
                <h3
                    className="text-sm font-medium text-white/90 dark:text-gray-200/90 mb-0.5
                               drop-shadow transition-colors duration-300"
                >
                    {title}
                </h3>
                {description && (
                    <p
                        className="text-xs text-white/70 dark:text-gray-300/70 drop-shadow
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
