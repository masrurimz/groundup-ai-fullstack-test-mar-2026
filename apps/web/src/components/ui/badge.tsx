import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        /* Industrial Severity Variants */
        critical:
          "border-transparent bg-severity-critical-bg text-severity-critical hover:bg-severity-critical-bg/80 dark:text-severity-critical dark:bg-severity-critical-bg/20",
        warning:
          "border-transparent bg-severity-warning-bg text-severity-warning hover:bg-severity-warning-bg/80 dark:text-severity-warning dark:bg-severity-warning-bg/20",
        info: "border-transparent bg-severity-info-bg text-severity-info hover:bg-severity-info-bg/80 dark:text-severity-info dark:bg-severity-info-bg/20",
        success:
          "border-transparent bg-severity-success-bg text-severity-success hover:bg-severity-success-bg/80 dark:text-severity-success dark:bg-severity-success-bg/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
