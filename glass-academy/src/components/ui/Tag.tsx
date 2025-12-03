interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export default function Tag({ children, className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted-background text-foreground ${className}`}>
      {children}
    </span>
  );
}
