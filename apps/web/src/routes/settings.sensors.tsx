import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  sensorsQueryOptions,
  useCreateSensorMutation,
  useUpdateSensorMutation,
} from "../lib/query/options";

export const Route = createFileRoute("/settings/sensors")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(machinesQueryOptions(false));
    void queryClient.ensureQueryData(sensorsQueryOptions(undefined, true));
  },
  component: SensorsPage,
});

const createSchema = z.object({
  machine_id: z.string().min(1, "Select a machine"),
  serial: z.string().min(1, "Serial is required"),
  name: z.string().min(1, "Name is required"),
});

function SensorsPage() {
  const machinesQuery = useQuery(machinesQueryOptions(false));
  const machines = machinesQuery.data ?? [];

  const [filterMachineId, setFilterMachineId] = useState<string | undefined>(undefined);
  const sensorsQuery = useQuery(sensorsQueryOptions(filterMachineId, true));

  const createMutation = useCreateSensorMutation();
  const updateMutation = useUpdateSensorMutation();

  const form = useForm({
    defaultValues: { machine_id: "" as string, serial: "", name: "" },
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync({
        machine_id: value.machine_id,
        serial: value.serial.trim(),
        name: value.name.trim(),
      });
      formApi.reset();
    },
  });

  const sensors = sensorsQuery.data ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Sensors</h1>
        <p className="mt-1 text-sm text-muted-foreground">Machine-scoped sensor hardware.</p>
      </div>

      {/* Create form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="mb-8 flex items-end gap-3"
      >
        <form.Field name="machine_id">
          {(field) => (
            <Field
              className="w-48"
              data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
            >
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

        <form.Field name="serial">
          {(field) => (
            <Field
              className="w-48"
              data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
            >
              <FieldLabel htmlFor={field.name}>Serial</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Sensor serial"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={form.state.isSubmitting}
              />
              <FieldError
                errors={field.state.meta.errors.map((e) =>
                  typeof e === "string" ? { message: e } : (e as { message?: string }),
                )}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <Field
              className="w-48"
              data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
            >
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Sensor name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={form.state.isSubmitting}
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
              Add Sensor
            </Button>
          )}
        </form.Subscribe>

        {createMutation.isError ? (
          <p className="self-center text-sm text-red-500">Failed to add. Try again.</p>
        ) : null}
        {createMutation.isSuccess ? (
          <p className="self-center text-sm text-emerald-600">Sensor added.</p>
        ) : null}
      </form>

      {/* Filter by machine */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by machine:</span>
        <Select
          value={filterMachineId || "__all__"}
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

      {/* Table */}
      {sensorsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : sensorsQuery.isError ? (
        <p className="text-sm text-red-500">Failed to load sensors.</p>
      ) : sensors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sensors yet. Add one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sensors.map((sensor) => (
              <TableRow key={sensor.id} className={sensor.is_active ? "" : "opacity-50"}>
                <TableCell className="font-medium">{sensor.name}</TableCell>
                <TableCell>{sensor.serial}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {sensor.machine_name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={sensor.is_active ? "default" : "secondary"}>
                    {sensor.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        sensor_id: sensor.id,
                        body: { is_active: !sensor.is_active },
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="text-xs"
                  >
                    {sensor.is_active ? "Deactivate" : "Reactivate"}
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
