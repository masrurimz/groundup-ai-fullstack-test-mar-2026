import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { z } from "zod";

import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const form = useForm({
    defaultValues: { action: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync({ action: value.action.trim() });
      formApi.reset();
    },
  });

  const actions = query.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Actions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Global response actions that operators can assign to alerts.
        </p>
      </div>

      {/* Create form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="mb-8 flex items-end gap-3"
      >
        <form.Field name="action">
          {(field) => (
            <Field
              className="w-72"
              data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
            >
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
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Add Action
            </Button>
          )}
        </form.Subscribe>

        {createMutation.isError ? (
          <p className="self-center text-sm text-red-500">Failed to add. Try again.</p>
        ) : null}
        {createMutation.isSuccess ? (
          <p className="self-center text-sm text-emerald-600">Action added.</p>
        ) : null}
      </form>

      {/* Table */}
      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : query.isError ? (
        <p className="text-sm text-red-500">Failed to load actions.</p>
      ) : actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No actions yet. Add one above.</p>
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
              <TableRow key={action.id} className={action.is_active ? "" : "opacity-50"}>
                <TableCell className="font-medium">{action.action}</TableCell>
                <TableCell>
                  <Badge variant={action.is_active ? "default" : "secondary"}>
                    {action.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        action_id: action.id,
                        body: { is_active: !action.is_active },
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="text-xs"
                  >
                    {action.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
