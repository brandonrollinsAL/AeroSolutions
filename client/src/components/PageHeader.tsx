import React from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  title: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className="space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground">{breadcrumb.title}</span>
              ) : (
                <Link href={breadcrumb.href} className="hover:text-foreground hover:underline">
                  {breadcrumb.title}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;