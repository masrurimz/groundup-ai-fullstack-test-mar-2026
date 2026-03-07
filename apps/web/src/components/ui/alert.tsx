import type { VariantProps } from "class-variance-authority";

import React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-sm border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current [&>svg~*]:translate-y-[-3px] [&>p]:leading-7 [&>ul]:ml-6 [&>ul]:list-disc [&>ul>li]:mt-2",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/20",
        /* Industrial Severity Variants */
        critical:
          "border-severity-critical/50 bg-severity-critical-bg text-severity-critical dark:border-severity-critical/30 dark:bg-severity-critical-bg/20",
        warning:
          "border-severity-warning/50 bg-severity-warning-bg text-severity-warning dark:border-severity-warning/30 dark:bg-severity-warning-bg/20",
        info: "border-severity-info/50 bg-severity-info-bg text-severity-info dark:border-severity-info/30 dark:bg-severity-info-bg/20",
        success:
          "border-severity-success/50 bg-severity-success-bg text-severity-success dark:border-severity-success/30 dark:bg-severity-success-bg/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  ),
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-tight tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
