import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  reasonsQueryOptions,
  useCreateReasonMutation,
  useUpdateReasonMutation,
} from "../lib/query/options";

export const Route = createFileRoute("/settings/reasons")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(machinesQueryOptions(false));
    void queryClient.ensureQueryData(reasonsQueryOptions(undefined, true));
  },
  component: ReasonsPage,
});

const createSchema = z.object({
  machine_id: z.number({ error: "Select a machine" }),
  reason: z.string().min(1, "Reason text is required"),
});

function ReasonsPage() {
  const machinesQuery = useQuery(machinesQueryOptions(false));
  const machines = machinesQuery.data ?? [];

  const [filterMachineId, setFilterMachineId] = useState<number | undefined>(undefined);
  const reasonsQuery = useQuery(reasonsQueryOptions(filterMachineId, true));

  const createMutation = useCreateReasonMutation();
  const updateMutation = useUpdateReasonMutation();

  const form = useForm({
    defaultValues: { machine_id: undefined as number | undefined, reason: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync({
        machine_id: value.machine_id!,
        reason: value.reason.trim(),
      });
      formApi.reset();
    },
  });

  const reasons = reasonsQuery.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Reasons</h1>
        <p className="mt-1 text-sm text-muted-foreground">Machine-scoped anomaly reason labels.</p>
      </div>

      {/* Create form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="mb-8 flex items-start gap-3"
      >
        <form.Field name="machine_id">
          {(field) => (
            <div className="w-48">
              <Select
                value={field.state.value != null ? String(field.state.value) : undefined}
                onValueChange={(v) => field.handleChange(Number(v))}
                disabled={form.state.isSubmitting || machinesQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                <p className="mt-1 text-xs text-red-500">{String(field.state.meta.errors[0])}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="reason">
          {(field) => (
            <div className="w-64">
              <Input
                placeholder="Reason label"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={form.state.isSubmitting}
              />
              {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                <p className="mt-1 text-xs text-red-500">{String(field.state.meta.errors[0])}</p>
              ) : null}
            </div>
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
              Add Reason
            </Button>
          )}
        </form.Subscribe>

        {createMutation.isError ? (
          <p className="self-center text-sm text-red-500">Failed to add. Try again.</p>
        ) : null}
        {createMutation.isSuccess ? (
          <p className="self-center text-sm text-emerald-600">Reason added.</p>
        ) : null}
      </form>

      {/* Filter by machine */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by machine:</span>
        <Select
          value={filterMachineId != null ? String(filterMachineId) : "__all__"}
          onValueChange={(v) => setFilterMachineId(v === "__all__" ? undefined : Number(v))}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Machines</SelectItem>
            {machines.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {reasonsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : reasonsQuery.isError ? (
        <p className="text-sm text-red-500">Failed to load reasons.</p>
      ) : reasons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reasons yet. Add one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reasons.map((reason) => (
              <TableRow key={reason.id} className={reason.is_active ? "" : "opacity-50"}>
                <TableCell className="font-medium">{reason.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {reason.machine_name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={reason.is_active ? "default" : "secondary"}>
                    {reason.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        reason_id: Number(reason.id),
                        body: { is_active: !reason.is_active },
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="text-xs"
                  >
                    {reason.is_active ? "Deactivate" : "Reactivate"}
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
