import React from "react";

export function PageHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col items-start gap-2 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeaderHeading({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={`text-4xl font-bold tracking-tight text-slate-800 ${className || ""}`}
      {...props}
    />
  );
}

export function PageHeaderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-lg text-slate-600 ${className || ""}`}
      {...props}
    />
  );
}