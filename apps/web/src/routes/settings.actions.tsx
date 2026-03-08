import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PlusCircle, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  actionsQueryOptions,
  useCreateActionMutation,
  useUpdateActionMutation,
} from "../lib/query/options";

export const Route = createFileRoute("/settings/actions")({
  loader: ({ context: { queryClient } }) =>
    void queryClient.ensureQueryData(actionsQueryOptions(true)),
  component: ActionsPage,
});

const createSchema = z.object({
  action: z.string().min(1, "Action label is required"),
});

function ActionsPage() {
  const query = useQuery(actionsQueryOptions(true));
  const createMutation = useCreateActionMutation();
  const updateMutation = useUpdateActionMutation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: { action: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createMutation.mutateAsync({ action: value.action.trim() });
        toast.success("Action added");
        formApi.reset();
        setDialogOpen(false);
      } catch {
        toast.error("Failed to add action. Try again.");
      }
    },
  });

  const actions = query.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Actions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Global response actions that operators can assign to alerts.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <PlusCircle className="h-4 w-4" /> Add Action
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Action</DialogTitle>
              <DialogDescription>Enter the label for the new action.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
              className="space-y-4 pt-2"
            >
              <form.Field name="action">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Action label</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Action label"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                      aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === "string" ? { message: e } : (e as { message?: string }),
                      )}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="w-full gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4" />
                    )}
                    Add Action
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : query.isError ? (
        <p className="text-sm text-red-500">Failed to load actions.</p>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Wrench className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">No actions yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first action.
          </p>
          <Button className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Add Action
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                onToggle={() =>
                  updateMutation.mutate({
                    action_id: action.id,
                    body: { is_active: !action.is_active },
                  })
                }
                isPending={updateMutation.isPending}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ActionRow({
  action,
  onToggle,
  isPending,
}: {
  action: { id: string; action: string; is_active: boolean };
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <TableRow className={action.is_active ? "" : "opacity-50"}>
      <TableCell className="font-medium">{action.action}</TableCell>
      <TableCell>
        <Badge variant={action.is_active ? "default" : "secondary"}>
          {action.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {action.is_active ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="sm" disabled={isPending} className="text-xs" />}
            >
              Deactivate
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate action?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will be marked inactive and hidden from active selection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onToggle}>Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            disabled={isPending}
            className="text-xs"
          >
            Reactivate
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
