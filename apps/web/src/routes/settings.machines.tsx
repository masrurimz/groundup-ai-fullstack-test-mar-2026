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
  machinesQueryOptions,
  useCreateMachineMutation,
  useUpdateMachineMutation,
} from "../lib/query/options";

export const Route = createFileRoute("/settings/machines")({
  loader: ({ context: { queryClient } }) =>
    void queryClient.ensureQueryData(machinesQueryOptions(true)),
  component: MachinesPage,
});

const createSchema = z.object({
  name: z.string().min(1, "Machine name is required"),
});

function MachinesPage() {
  const query = useQuery(machinesQueryOptions(true));
  const createMutation = useCreateMachineMutation();
  const updateMutation = useUpdateMachineMutation();

  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync({ name: value.name.trim() });
      formApi.reset();
    },
  });

  const machines = query.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Machines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the machines monitored by the system.
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
        <form.Field name="name">
          {(field) => (
            <Field
              className="w-72"
              data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
            >
              <FieldLabel htmlFor={field.name}>Machine name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Machine name"
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
              Add Machine
            </Button>
          )}
        </form.Subscribe>

        {createMutation.isError ? (
          <p className="self-center text-sm text-red-500">Failed to add. Try again.</p>
        ) : null}
        {createMutation.isSuccess ? (
          <p className="self-center text-sm text-emerald-600">Machine added.</p>
        ) : null}
      </form>

      {/* Table */}
      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : query.isError ? (
        <p className="text-sm text-red-500">Failed to load machines.</p>
      ) : machines.length === 0 ? (
        <p className="text-sm text-muted-foreground">No machines yet. Add one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.map((machine) => (
              <MachineRow
                key={machine.id}
                machine={machine}
                onToggle={() =>
                  updateMutation.mutate({
                    machine_id: Number(machine.id),
                    body: { is_active: !machine.is_active },
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

function MachineRow({
  machine,
  onToggle,
  isPending,
}: {
  machine: { id: number; name: string; is_active: boolean };
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <TableRow className={machine.is_active ? "" : "opacity-50"}>
      <TableCell className="font-medium">{machine.name}</TableCell>
      <TableCell>
        <Badge variant={machine.is_active ? "default" : "secondary"}>
          {machine.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          disabled={isPending}
          className="text-xs"
        >
          {machine.is_active ? "Deactivate" : "Reactivate"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
