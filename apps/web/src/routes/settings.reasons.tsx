import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PlusCircle, Tag } from "lucide-react";
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
} from "../lib/query";

export const Route = createFileRoute("/settings/reasons")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(machinesQueryOptions(false));
    void queryClient.ensureQueryData(reasonsQueryOptions(undefined, true));
  },
  component: ReasonsPage,
});

const createSchema = z.object({
  machine_id: z.string().min(1, "Select a machine"),
  reason: z.string().min(1, "Reason text is required"),
});

function ReasonsPage() {
  const machinesQuery = useQuery(machinesQueryOptions(false));
  const machines = machinesQuery.data ?? [];

  const [filterMachineId, setFilterMachineId] = useState<string | undefined>(undefined);
  const reasonsQuery = useQuery(reasonsQueryOptions(filterMachineId, true));

  const createMutation = useCreateReasonMutation();
  const updateMutation = useUpdateReasonMutation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: { machine_id: undefined as string | undefined, reason: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createMutation.mutateAsync({
          machine_id: value.machine_id!,
          reason: value.reason.trim(),
        });
        toast.success("Reason added");
        formApi.reset();
        setDialogOpen(false);
      } catch {
        toast.error("Failed to add reason. Try again.");
      }
    },
  });

  const reasons = reasonsQuery.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Reasons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Machine-scoped anomaly reason labels.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <PlusCircle className="h-4 w-4" /> Add Reason
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reason</DialogTitle>
              <DialogDescription>Select a machine and enter the reason label.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
              className="space-y-4 pt-2"
            >
              <form.Field name="machine_id">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Machine</FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(v) => field.handleChange(v ?? "")}
                      disabled={form.state.isSubmitting || machinesQuery.isLoading}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select machine" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === "string" ? { message: e } : (e as { message?: string }),
                      )}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="reason">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Reason</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Reason label"
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
                    Add Reason
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by machine */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by machine:</span>
        <Select
          value={filterMachineId != null ? filterMachineId : "__all__"}
          onValueChange={(v) => setFilterMachineId(v === "__all__" || !v ? undefined : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue>
              {filterMachineId == null
                ? "All Machines"
                : (machines.find((m) => m.id === filterMachineId)?.name ?? "All Machines")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Machines</SelectItem>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reasonsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : reasonsQuery.isError ? (
        <p className="text-sm text-red-500">Failed to load reasons.</p>
      ) : reasons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Tag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">No reasons yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first reason.
          </p>
          <Button className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Add Reason
          </Button>
        </div>
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
              <ReasonRow
                key={reason.id}
                reason={reason}
                onToggle={() =>
                  updateMutation.mutate({
                    reason_id: reason.id,
                    body: { is_active: !reason.is_active },
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

function ReasonRow({
  reason,
  onToggle,
  isPending,
}: {
  reason: { id: string; reason: string; machine_name?: string; is_active: boolean };
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <TableRow className={reason.is_active ? "" : "opacity-50"}>
      <TableCell className="font-medium">{reason.reason}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{reason.machine_name ?? "—"}</TableCell>
      <TableCell>
        <Badge variant={reason.is_active ? "default" : "secondary"}>
          {reason.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {reason.is_active ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="sm" disabled={isPending} className="text-xs" />}
            >
              Deactivate
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate reason?</AlertDialogTitle>
                <AlertDialogDescription>
                  This reason will be marked inactive and hidden from active selection.
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
