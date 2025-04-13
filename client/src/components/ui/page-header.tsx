import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function PageHeader({ className, children, ...props }: PageHeaderProps) {
  return (
    <div className={cn("grid gap-1", className)} {...props}>
      {children}
    </div>
  );
}

interface PageHeaderHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children: React.ReactNode;
}

export function PageHeaderHeading({ className, children, ...props }: PageHeaderHeadingProps) {
  return (
    <h1
      className={cn(
        "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

interface PageHeaderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children: React.ReactNode;
}

export function PageHeaderDescription({ className, children, ...props }: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn("text-lg text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

interface PageHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function PageHeaderActions({ className, children, ...props }: PageHeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 pt-2 md:pt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}