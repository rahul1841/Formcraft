"use client";

import { useId, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageOff,
  RotateCcw,
} from "lucide-react";
import {
  DEFAULT_THEME,
  FONT_OPTIONS,
  THEME_PRESETS,
  type ThemePreset,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/components/builder/builder-context";
import {
  Labeled,
  Section,
} from "@/components/builder/FieldSettingsPanel";
import { Button } from "@/components/ui/Button";
import { ColorInput } from "@/components/ui/ColorInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FieldShell, Input } from "@/components/ui/Input";
import { RangeControl } from "@/components/ui/RangeControl";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import type {
  Align,
  BackgroundPattern,
  ButtonStyle,
  FontSize,
  FormTheme,
  InputStyle,
  Spacing,
} from "@/lib/types";

const FONT_SIZE_OPTIONS: SegmentOption<FontSize>[] = [
  { value: "sm", label: "S", title: "Small" },
  { value: "base", label: "M", title: "Medium" },
  { value: "lg", label: "L", title: "Large" },
];

const SPACING_OPTIONS: SegmentOption<Spacing>[] = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
];

const INPUT_STYLE_OPTIONS: SegmentOption<InputStyle>[] = [
  { value: "outlined", label: "Outlined" },
  { value: "filled", label: "Filled" },
  { value: "underlined", label: "Underline" },
];

const BUTTON_STYLE_OPTIONS: SegmentOption<ButtonStyle>[] = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "soft", label: "Soft" },
];

const BUTTON_ALIGN_OPTIONS: SegmentOption<Align | "full">[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Right" },
  { value: "full", label: "Full" },
];

const LABEL_ALIGN_OPTIONS: SegmentOption<Align>[] = [
  { value: "left", icon: <AlignLeft className="size-4" />, title: "Align left" },
  {
    value: "center",
    icon: <AlignCenter className="size-4" />,
    title: "Align centre",
  },
  {
    value: "right",
    icon: <AlignRight className="size-4" />,
    title: "Align right",
  },
];

const PATTERN_OPTIONS: SegmentOption<BackgroundPattern>[] = [
  { value: "none", label: "None" },
  { value: "dots", label: "Dots" },
  { value: "grid", label: "Grid" },
  { value: "gradient", label: "Gradient" },
];

const COLOR_FIELDS: { key: keyof FormTheme; label: string }[] = [
  { key: "primaryColor", label: "Primary" },
  { key: "backgroundColor", label: "Page background" },
  { key: "cardBackground", label: "Card background" },
  { key: "textColor", label: "Text" },
  { key: "mutedTextColor", label: "Muted text" },
  { key: "borderColor", label: "Borders" },
];

const looksLikeImageUrl = (value: string) =>
  /^https?:\/\/\S+$/i.test(value.trim());

function presetIsActive(preset: ThemePreset, theme: FormTheme) {
  return (Object.keys(preset.theme) as (keyof FormTheme)[]).every(
    (key) =>
      String(theme[key]).toLowerCase() ===
      String(preset.theme[key]).toLowerCase(),
  );
}

export function DesignPanel() {
  const { form, updateTheme } = useBuilder();
  const theme = form.theme;
  const fontSelectId = useId();
  const [resetting, setResetting] = useState(false);
  // Remembers which URL failed to load, so editing the field clears the notice.
  const [brokenCover, setBrokenCover] = useState<string | null>(null);

  const cover = theme.coverImageUrl?.trim() ?? "";
  const coverBroken = brokenCover === cover;

  return (
    <div className="divide-y divide-slate-100 pb-10">
      {/* ------------------------------- presets ------------------------------ */}
      <Section title="Presets">
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((preset) => {
            const active = presetIsActive(preset, theme);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => updateTheme(preset.theme)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
                  active
                    ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/25"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span className="flex flex-none -space-x-1">
                  {[
                    preset.theme.primaryColor,
                    preset.theme.backgroundColor,
                    preset.theme.textColor,
                  ].map((color, i) => (
                    <span
                      key={i}
                      className="size-3.5 rounded-full ring-1 ring-inset ring-black/10"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="truncate text-[12.5px] font-medium text-slate-700">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------- colours ------------------------------ */}
      <Section title="Colours">
        <div className="space-y-2.5">
          {COLOR_FIELDS.map(({ key, label }) => (
            <ColorInput
              key={key}
              label={label}
              value={String(theme[key])}
              onChange={(hex) => updateTheme({ [key]: hex } as Partial<FormTheme>)}
            />
          ))}
        </div>
      </Section>

      {/* ----------------------------- typography ----------------------------- */}
      <Section title="Typography">
        <FieldShell label="Font" htmlFor={fontSelectId}>
          <select
            id={fontSelectId}
            value={theme.fontFamily}
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            style={{ fontFamily: theme.fontFamily }}
            className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-900 shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          >
            {(["Sans", "Serif", "Mono"] as const).map((category) => (
              <optgroup key={category} label={category}>
                {FONT_OPTIONS.filter((f) => f.category === category).map(
                  (font) => (
                    <option
                      key={font.id}
                      value={font.stack}
                      style={{ fontFamily: font.stack }}
                    >
                      {font.name}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
        </FieldShell>

        <Labeled label="Base text size">
          <SegmentedControl
            value={theme.fontSize}
            options={FONT_SIZE_OPTIONS}
            onChange={(v) => updateTheme({ fontSize: v })}
          />
        </Labeled>
      </Section>

      {/* ------------------------------- layout ------------------------------- */}
      <Section title="Layout">
        <RangeControl
          label="Corner radius"
          min={0}
          max={24}
          suffix="px"
          value={theme.borderRadius}
          onChange={(v) => updateTheme({ borderRadius: v })}
        />
        <Labeled label="Spacing">
          <SegmentedControl
            value={theme.spacing}
            options={SPACING_OPTIONS}
            onChange={(v) => updateTheme({ spacing: v })}
          />
        </Labeled>
        <RangeControl
          label="Form width"
          min={480}
          max={1000}
          step={20}
          suffix="px"
          value={theme.maxWidth}
          onChange={(v) => updateTheme({ maxWidth: v })}
        />
      </Section>

      {/* ------------------------------- fields ------------------------------- */}
      <Section title="Fields">
        <Labeled label="Input style">
          <SegmentedControl
            value={theme.inputStyle}
            options={INPUT_STYLE_OPTIONS}
            onChange={(v) => updateTheme({ inputStyle: v })}
          />
        </Labeled>
        <Labeled label="Label alignment">
          <SegmentedControl
            value={theme.labelAlign}
            options={LABEL_ALIGN_OPTIONS}
            onChange={(v) => updateTheme({ labelAlign: v })}
          />
        </Labeled>
        <Switch
          label="Number the questions"
          description="Shows 1., 2., 3. before each question."
          checked={theme.showQuestionNumbers}
          onChange={(v) => updateTheme({ showQuestionNumbers: v })}
        />
      </Section>

      {/* ------------------------------- button ------------------------------- */}
      <Section title="Submit button">
        <Labeled label="Style">
          <SegmentedControl
            value={theme.buttonStyle}
            options={BUTTON_STYLE_OPTIONS}
            onChange={(v) => updateTheme({ buttonStyle: v })}
          />
        </Labeled>
        <Labeled label="Alignment">
          <SegmentedControl
            value={theme.buttonAlign}
            options={BUTTON_ALIGN_OPTIONS}
            onChange={(v) => updateTheme({ buttonAlign: v })}
          />
        </Labeled>
      </Section>

      {/* ----------------------------- background ----------------------------- */}
      <Section title="Background">
        <Labeled label="Pattern">
          <SegmentedControl
            value={theme.backgroundPattern}
            options={PATTERN_OPTIONS}
            onChange={(v) => updateTheme({ backgroundPattern: v })}
          />
        </Labeled>

        <Input
          label="Cover image URL"
          type="url"
          inputMode="url"
          spellCheck={false}
          placeholder="https://images.example.com/banner.jpg"
          value={theme.coverImageUrl ?? ""}
          hint="Shown as a banner across the top of the form card."
          onChange={(e) => updateTheme({ coverImageUrl: e.target.value })}
        />

        {cover && looksLikeImageUrl(cover) ? (
          coverBroken ? (
            <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
              <ImageOff className="size-4 flex-none" aria-hidden />
              That image couldn&rsquo;t be loaded. Check the link is public.
            </p>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cover}
              alt="Cover preview"
              key={cover}
              onError={() => setBrokenCover(cover)}
              className="h-20 w-full rounded-lg border border-slate-200 object-cover"
            />
          )
        ) : null}
      </Section>

      {/* -------------------------------- reset ------------------------------- */}
      <Section>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          icon={<RotateCcw className="size-4" />}
          onClick={() => setResetting(true)}
        >
          Reset to default theme
        </Button>
      </Section>

      <ConfirmDialog
        open={resetting}
        onClose={() => setResetting(false)}
        onConfirm={() => updateTheme(DEFAULT_THEME)}
        title="Reset the theme?"
        description="Every colour, font and layout tweak on this form goes back to the Formcraft default. Your fields and responses aren't touched, and you can undo this with ⌘Z."
        confirmLabel="Reset theme"
        tone="primary"
      />
    </div>
  );
}
