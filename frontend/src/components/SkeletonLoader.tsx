interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export default function SkeletonLoader({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-muted rounded";
  
  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4`}
            style={{ 
              width: index === lines - 1 ? '75%' : '100%',
              ...(width && { width })
            }}
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{ 
          width: width || '40px', 
          height: height || width || '40px' 
        }}
      />
    );
  }
  
  if (variant === 'card') {
    return (
      <div className={`${baseClasses} p-6 space-y-4 ${className}`}>
        <div className="flex items-center space-x-4">
          <SkeletonLoader variant="circular" width="48px" />
          <div className="flex-1">
            <SkeletonLoader variant="text" lines={2} />
          </div>
        </div>
        <SkeletonLoader variant="text" lines={3} />
      </div>
    );
  }
  
  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px' 
      }}
    />
  );
}