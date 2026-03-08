import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PlusCircle, Server } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createMutation.mutateAsync({ name: value.name.trim() });
        toast.success("Machine added");
        formApi.reset();
        setDialogOpen(false);
      } catch {
        toast.error("Failed to add machine. Try again.");
      }
    },
  });

  const machines = query.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Machines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the machines monitored by the system.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <PlusCircle className="h-4 w-4" /> Add Machine
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Machine</DialogTitle>
              <DialogDescription>Enter the name of the new machine.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
              className="space-y-4 pt-2"
            >
              <form.Field name="name">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
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
                    Add Machine
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
        <p className="text-sm text-red-500">Failed to load machines.</p>
      ) : machines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">No machines yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first machine.
          </p>
          <Button className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Add Machine
          </Button>
        </div>
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
                    machine_id: machine.id,
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
  machine: { id: string; name: string; is_active: boolean };
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
        {machine.is_active ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="sm" disabled={isPending} className="text-xs" />}
            >
              Deactivate
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate machine?</AlertDialogTitle>
                <AlertDialogDescription>
                  This machine will be marked inactive and hidden from active monitoring.
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
