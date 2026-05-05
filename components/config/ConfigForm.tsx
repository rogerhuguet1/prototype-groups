"use client";

import { useState } from "react";
import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { t } from "@/lib/i18n/strings";
import {
  HARD_MAX_GROUP_SIZE,
  HARD_MIN_GROUP_SIZE,
} from "@/lib/domain/constants";

export function ConfigForm() {
  const config = useGroupingStore((s) => s.sessionConfig);
  const update = useGroupingStore((s) => s.updateSessionConfig);
  const pushToast = useGroupingStore((s) => s.pushToast);

  const [name, setName] = useState(config.name);
  const [min, setMin] = useState(config.minGroupSize);
  const [max, setMax] = useState(config.maxGroupSize);

  return (
    <section className="mx-auto w-full max-w-xl space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-rbx-text-primary">
          {t.config.title}
        </h2>
        <p className="mt-1 text-sm text-rbx-text-secondary">
          Estos valores afectan a la sesión actual. Al cambiar el tamaño máximo,
          la capacidad de los grupos existentes se actualiza.
        </p>
      </header>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          update({ name, minGroupSize: min, maxGroupSize: max });
          pushToast("success", t.toast.config_saved);
        }}
      >
        <Field label={t.config.session_name_label} htmlFor="cfg-name">
          <Input
            id="cfg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t.config.min_size_label} htmlFor="cfg-min">
            <Input
              id="cfg-min"
              type="number"
              min={HARD_MIN_GROUP_SIZE}
              max={HARD_MAX_GROUP_SIZE}
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </Field>
          <Field label={t.config.max_size_label} htmlFor="cfg-max">
            <Input
              id="cfg-max"
              type="number"
              min={HARD_MIN_GROUP_SIZE}
              max={HARD_MAX_GROUP_SIZE}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="primary" type="submit">
            {t.config.save}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-rbx-text-primary">
        {label}
      </label>
      {children}
    </div>
  );
}
