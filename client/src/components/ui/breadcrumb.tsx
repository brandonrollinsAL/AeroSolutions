import * as React from "react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  separator?: React.ReactNode;
}

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
  isCurrentPage?: boolean;
}

interface BreadcrumbLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  href?: string;
  asChild?: boolean;
}

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("mx-2 text-muted-foreground", className)}
    {...props}
  >
    {children || "/"}
  </span>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, children, separator = "/", ...props }, ref) => {
    const separatorIcon = React.useMemo(() => {
      if (React.isValidElement(separator)) return separator;
      return <span aria-hidden="true">{separator}</span>;
    }, [separator]);

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex", className)}
        {...props}
      >
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground">
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement<BreadcrumbItemProps>(child)) {
              return child;
            }

            return React.cloneElement(child, {
              ...child.props,
              separator: separatorIcon,
              isLastItem: index === React.Children.count(children) - 1,
            });
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps & { separator?: React.ReactNode; isLastItem?: boolean }>(
  ({ className, children, separator, isLastItem, isCurrentPage, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("inline-flex items-center gap-1.5", className)}
        aria-current={isCurrentPage ? "page" : undefined}
        {...props}
      >
        {children}
        {!isLastItem && separator}
      </li>
    );
  }
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, children, href, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "transition-colors hover:text-foreground",
          href ? "hover:underline" : "cursor-default",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator };