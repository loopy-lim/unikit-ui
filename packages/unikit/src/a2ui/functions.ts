import { spec, type FunctionImplementation } from "@a2ui/web_core";
import {
  DynamicBooleanSchema,
  DynamicNumberSchema,
  DynamicStringSchema,
  DynamicValueSchema,
  DataBindingSchema,
  FunctionCallSchema,
} from "./schemas";
import {
  ExpressionParser,
  computed,
  getValue,
  isSignal,
  type DataContext,
} from "@a2ui/web_core";
import { z } from "zod";

export type OpenUrlHandler = (url: string) => void | Promise<void>;

let openUrlHandler: OpenUrlHandler | undefined;

export function setA2uiOpenUrlHandler(handler: OpenUrlHandler | undefined): void {
  openUrlHandler = handler;
}

export type A2uiBasicFunctionsOptions = {
  locale?: string;
  catalogId?: string;
};

type Validation = { valid: boolean; message?: string };

function resolveLocale(locale: unknown): string {
  if (typeof locale !== "string" || !locale) return "en-US";
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length > 0 ? locale : "en-US";
  } catch {
    return "en-US";
  }
}

function localeOf(context: DataContext): string {
  const candidate = (context as { locale?: unknown }).locale;
  return resolveLocale(typeof candidate === "string" ? candidate : undefined);
}

function stringOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function validityOf(value: unknown): boolean | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const valid = (value as { valid?: unknown }).valid;
    if (typeof valid === "boolean") return valid;
  }
  return undefined;
}

function truthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const valid = validityOf(value);
  if (valid !== undefined) return valid;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  return false;
}

function validateRequired(val: unknown): Validation {
  let valid = true;
  if (val === null || val === undefined) valid = false;
  else if (typeof val === "string" && val === "") valid = false;
  else if (Array.isArray(val) && val.length === 0) valid = false;
  return valid ? { valid: true } : { valid: false, message: "This field is required." };
}

function validateRegex(val: unknown, pattern: unknown): Validation {
  let compiled: RegExp;
  try {
    compiled = new RegExp(stringOf(pattern), "u");
  } catch {
    return { valid: false, message: "Value does not match required pattern." };
  }
  const isValid = compiled.test(String(val ?? ""));
  return isValid
    ? { valid: true }
    : { valid: false, message: "Value does not match required pattern." };
}

function validateLength(val: unknown, min: unknown, max: unknown): Validation {
  let len = 0;
  if (typeof val === "string" || Array.isArray(val)) len = val.length;
  const minNumber = typeof min === "number" && !Number.isNaN(min) ? min : undefined;
  const maxNumber = typeof max === "number" && !Number.isNaN(max) ? max : undefined;
  if (minNumber !== undefined && len < minNumber) {
    return { valid: false, message: `Minimum length is ${minNumber}.` };
  }
  if (maxNumber !== undefined && len > maxNumber) {
    return { valid: false, message: `Maximum length is ${maxNumber}.` };
  }
  return { valid: true };
}

function validateNumeric(val: unknown, min: unknown, max: unknown): Validation {
  const num = Number(val);
  if (Number.isNaN(num)) {
    return { valid: false, message: "Value must be a valid number." };
  }
  const minNumber = typeof min === "number" && !Number.isNaN(min) ? min : undefined;
  const maxNumber = typeof max === "number" && !Number.isNaN(max) ? max : undefined;
  if (minNumber !== undefined && num < minNumber) {
    return { valid: false, message: `Minimum value is ${minNumber}.` };
  }
  if (maxNumber !== undefined && num > maxNumber) {
    return { valid: false, message: `Maximum value is ${maxNumber}.` };
  }
  return { valid: true };
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(val: unknown): Validation {
  const isValid = typeof val === "string" && EMAIL_REGEX.test(val);
  return isValid
    ? { valid: true }
    : { valid: false, message: "Please enter a valid email address (e.g. user@example.com)." };
}

type TemplateAstPart = Record<string, unknown> & { path?: unknown; call?: unknown; "@call"?: unknown };

function adaptTemplatePart(part: unknown, catalogId: string | undefined): unknown {
  if (Array.isArray(part)) {
    return part.map((item) => adaptTemplatePart(item, catalogId));
  }
  if (part === null || typeof part !== "object") {
    return part;
  }
  const source = part as TemplateAstPart;
  if (
    typeof source.path === "string" &&
    source.componentId === undefined &&
    source["@path"] === undefined
  ) {
    return { "@path": source.path };
  }
  const callName = typeof source.call === "string" ? source.call : undefined;
  if (callName !== undefined && source["@call"] === undefined) {
    const args: Record<string, unknown> = {};
    const sourceArgs = source.args;
    if (sourceArgs && typeof sourceArgs === "object" && !Array.isArray(sourceArgs)) {
      for (const [key, value] of Object.entries(sourceArgs)) {
        args[key] = adaptTemplatePart(value, catalogId);
      }
    }
    return catalogId !== undefined ? { "@call": callName, args, catalogId } : { "@call": callName, args };
  }
  const adapted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    adapted[key] = adaptTemplatePart(value, catalogId);
  }
  return adapted;
}

function executeFormatString(template: string, context: DataContext, catalogId: string | undefined): unknown {
  const parser = new ExpressionParser();
  const parts = parser.parse(template);
  if (parts.length === 0) return "";
  const dynamicParts = parts.map((part) => {
    if (typeof part !== "object" || part === null || Array.isArray(part)) {
      return part;
    }
    return context.resolveSignal(adaptTemplatePart(part, catalogId));
  });
  return computed(() =>
    dynamicParts
      .map((part) => stringOf(isSignal(part) ? getValue(part) : part))
      .join(""),
  );
}

function formatNumberValue(
  value: unknown,
  decimals: unknown,
  grouping: unknown,
  locale: string,
): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  const fractionDigits =
    typeof decimals === "number" && !Number.isNaN(decimals) ? decimals : undefined;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: typeof grouping === "boolean" ? grouping : undefined,
  }).format(num);
}

function formatCurrencyValue(
  value: unknown,
  currencyInput: unknown,
  decimals: unknown,
  grouping: unknown,
  locale: string,
): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  const currency = stringOf(currencyInput).toUpperCase();
  const fractionDigits =
    typeof decimals === "number" && !Number.isNaN(decimals) ? decimals : 2;
  const useGrouping = typeof grouping === "boolean" ? grouping : undefined;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping,
    }).format(num);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "code",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping,
    })
      .formatToParts(num)
      .map((part) => (part.type === "currency" ? currency : part.value))
      .join("");
  }
}

const DATE_TOKENS = /yyyy|yy|MMMM|MMM|MM|M|EEEE|E|dd|d|HH|H|hh|h|mm|ss|a/g;
const ISO_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;
const WRITTEN_FIELDS = /^([+-]?\d{4,6})-(\d{2})-(\d{2})(?:[T ](\d{2})(?::(\d{2})(?::(\d{2}))?)?)?/;

function parseTimestamp(value: string): { shifted: Date; instant: Date } | null {
  const instant = new Date(ISO_OFFSET.test(value) ? value : `${value}Z`);
  if (Number.isNaN(instant.getTime())) return null;
  let offsetMinutes = 0;
  const match = /([+-])(\d{2}):?(\d{2})$/.exec(value);
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    offsetMinutes = sign * (Number(match[2]) * 60 + Number(match[3]));
  }
  const shifted = new Date(instant.getTime() + offsetMinutes * 60_000);
  const written = WRITTEN_FIELDS.exec(value);
  if (!written) return null;
  const field = (group: number | undefined) =>
    written[group as number] === undefined ? undefined : Number(written[group as number]);
  const roundTrips =
    field(1) === shifted.getUTCFullYear() &&
    field(2) === shifted.getUTCMonth() + 1 &&
    field(3) === shifted.getUTCDate() &&
    (field(4) ?? shifted.getUTCHours()) === shifted.getUTCHours() &&
    (field(5) ?? shifted.getUTCMinutes()) === shifted.getUTCMinutes() &&
    (field(6) ?? shifted.getUTCSeconds()) === shifted.getUTCSeconds();
  return roundTrips ? { shifted, instant } : null;
}

function dateNamesOf(locale: string): {
  monthsLong: string[];
  monthsShort: string[];
  weekdaysLong: string[];
  weekdaysShort: string[];
} {
  const dateTimeFormat = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const monthsLong = Array.from({ length: 12 }, (_, month) =>
    dateTimeFormat.format(new Date(Date.UTC(2026, month, 15))),
  );
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  const weekdaysLong = Array.from({ length: 7 }, (_, day) =>
    weekdayFormat.format(new Date(Date.UTC(2026, 2, 15 + day))),
  );
  return {
    monthsLong,
    monthsShort: monthsLong.map((month) => month.slice(0, 3)),
    weekdaysLong,
    weekdaysShort: weekdaysLong.map((day) => day.slice(0, 3)),
  };
}

function formatDateValue(value: unknown, formatPattern: unknown, locale: string): string {
  const raw = stringOf(value);
  if (!raw) return "";
  const parsed = parseTimestamp(raw);
  if (!parsed) return "";
  const { shifted, instant } = parsed;
  const pattern = stringOf(formatPattern) || "yyyy-MM-dd";
  if (pattern === "ISO") return instant.toISOString();
  const names = dateNamesOf(locale);
  const weekdayIndex = (shifted.getUTCDay() + 6) % 7;
  const hours = shifted.getUTCHours();
  const hours12 = hours % 12 || 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  return pattern.replace(DATE_TOKENS, (token) => {
    switch (token) {
      case "yyyy":
        return String(shifted.getUTCFullYear());
      case "yy":
        return String(shifted.getUTCFullYear()).slice(-2);
      case "MMMM":
        return names.monthsLong[shifted.getUTCMonth()];
      case "MMM":
        return names.monthsShort[shifted.getUTCMonth()];
      case "MM":
        return pad(shifted.getUTCMonth() + 1);
      case "M":
        return String(shifted.getUTCMonth() + 1);
      case "EEEE":
        return names.weekdaysLong[weekdayIndex];
      case "E":
        return names.weekdaysShort[weekdayIndex];
      case "dd":
        return pad(shifted.getUTCDate());
      case "d":
        return String(shifted.getUTCDate());
      case "HH":
        return pad(hours);
      case "H":
        return String(hours);
      case "hh":
        return pad(hours12);
      case "h":
        return String(hours12);
      case "mm":
        return pad(shifted.getUTCMinutes());
      case "ss":
        return pad(shifted.getUTCSeconds());
      case "a":
        return hours < 12 ? "AM" : "PM";
      default:
        return token;
    }
  });
}

function pluralizeValue(value: unknown, forms: Record<string, unknown>, locale: string): string {
  const count = Number(value);
  let category: string;
  if (count === 0 && forms["zero"] !== undefined) category = "zero";
  else if (count === 1 && forms["one"] !== undefined) category = "one";
  else if (count === 2 && forms["two"] !== undefined) category = "two";
  else category = new Intl.PluralRules(locale).select(count);
  return stringOf(forms[category] ?? forms["other"] ?? "");
}

function executeOpenUrl(urlInput: unknown): void {
  const url = stringOf(urlInput);
  if (!url) return;
  if (openUrlHandler) {
    void openUrlHandler(url);
    return;
  }
  if (typeof window === "object" && typeof window.open === "function") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function createA2uiBasicFunctions(options?: A2uiBasicFunctionsOptions): FunctionImplementation[] {
  const locale = resolveLocale(options?.locale);
  const catalogId = options?.catalogId;
  return [
    {
      name: "required",
      returnType: "validationResult",
      description: "Checks that the value is not null, undefined, or empty.",
      schema: spec(
        z
          .object({
            value: z
              .any()
              .refine((v) => v !== undefined, "Required")
              .describe("The value to check."),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => validateRequired(args.value),
    },
    {
      name: "regex",
      returnType: "validationResult",
      description: "Checks that the value matches a regular expression string.",
      schema: spec(
        z
          .object({
            value: DynamicStringSchema.describe("REF:#/$defs/DynamicString"),
            pattern: z
              .string()
              .describe(
                "The regular expression to search for in the value. Uses the A2UI regex dialect: a portable subset of ECMAScript pattern syntax in Unicode mode with no flags. Matching is case-sensitive, '.' excludes line terminators, and '^' and '$' match only at the ends of the value. Backreferences, lookbehind, named groups and '\\p{...}' are not allowed. Patterns longer than 256 code points or that could backtrack catastrophically are rejected.",
              ),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => validateRegex(args.value, args.pattern),
    },
    {
      name: "length",
      returnType: "validationResult",
      description: "Checks string length constraints.",
      schema: spec(
        z
          .object({
            value: DynamicStringSchema.describe("REF:#/$defs/DynamicString"),
            min: z.number().int().min(0).describe("The minimum allowed length.").optional(),
            max: z.number().int().min(0).describe("The maximum allowed length.").optional(),
          })
          .strict()
          .refine((args) => args.min !== undefined || args.max !== undefined, {
            message: "At least one of 'min', 'max' must be provided.",
          }),
        {
          closure: "unevaluatedProperties",
          keywords: { anyOf: [{ required: ["min"] }, { required: ["max"] }] },
        },
      ),
      execute: (args) => validateLength(args.value, args.min, args.max),
    },
    {
      name: "numeric",
      returnType: "validationResult",
      description: "Checks numeric range constraints.",
      schema: spec(
        z
          .object({
            value: DynamicNumberSchema.describe("REF:#/$defs/DynamicNumber"),
            min: z.number().describe("The minimum allowed value.").optional(),
            max: z.number().describe("The maximum allowed value.").optional(),
          })
          .strict()
          .refine((args) => args.min !== undefined || args.max !== undefined, {
            message: "At least one of 'min', 'max' must be provided.",
          }),
        {
          closure: "unevaluatedProperties",
          keywords: { anyOf: [{ required: ["min"] }, { required: ["max"] }] },
        },
      ),
      execute: (args) => validateNumeric(args.value, args.min, args.max),
    },
    {
      name: "email",
      returnType: "validationResult",
      description: "Checks that the value is a valid email address.",
      schema: spec(
        z
          .object({
            value: DynamicStringSchema.describe("REF:#/$defs/DynamicString"),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => validateEmail(args.value),
    },
    {
      name: "formatString",
      returnType: "string",
      description:
        "Performs string interpolation of data model values and other functions in the catalog functions list and returns the resulting string. The value string can contain interpolated expressions in the `${expression}` format. Supported expression types include: JSON Pointer paths to the data model (e.g., `${/absolute/path}` or `${relative/path}`), and renderer-side function calls (e.g., `${now()}`). Function arguments must be named (e.g., `${formatDate(value:${/currentDate}, format:'MM-dd')}`). To include a literal `${` sequence, escape it as `\\${`.",
      schema: spec(
        z
          .object({
            value: DynamicStringSchema.describe("REF:#/$defs/DynamicString"),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args, context) => executeFormatString(stringOf(args.value), context, catalogId),
    },
    {
      name: "formatNumber",
      returnType: "string",
      description: "Formats a number with the specified grouping and decimal precision.",
      schema: spec(
        z
          .object({
            value: DynamicNumberSchema.describe("REF:#/$defs/DynamicNumber|The number to format."),
            decimals: DynamicNumberSchema.describe(
              "REF:#/$defs/DynamicNumber|Optional. The number of decimal places to show. Defaults to 0 or 2 depending on locale.",
            ).optional(),
            grouping: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|Optional. If true, uses locale-specific grouping separators (e.g. '1,000'). If false, returns raw digits (e.g. '1000'). Defaults to true.",
            ).optional(),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args, context) =>
        formatNumberValue(args.value, args.decimals, args.grouping, localeOf(context) || locale),
    },
    {
      name: "formatCurrency",
      returnType: "string",
      description: "Formats a number as a currency string.",
      schema: spec(
        z
          .object({
            value: DynamicNumberSchema.describe("REF:#/$defs/DynamicNumber|The monetary amount."),
            currency: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The ISO 4217 currency code (e.g., 'USD', 'EUR').",
            ),
            decimals: DynamicNumberSchema.describe(
              "REF:#/$defs/DynamicNumber|Optional. The number of decimal places to show. Defaults to 0 or 2 depending on locale.",
            ).optional(),
            grouping: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|Optional. If true, uses locale-specific grouping separators (e.g. '1,000'). If false, returns raw digits (e.g. '1000'). Defaults to true.",
            ).optional(),
          })
          .strict(),
        { required: ["currency", "value"], closure: "unevaluatedProperties" },
      ),
      execute: (args, context) =>
        formatCurrencyValue(
          args.value,
          args.currency,
          args.decimals,
          args.grouping,
          localeOf(context) || locale,
        ),
    },
    {
      name: "formatDate",
      returnType: "string",
      description: "Formats a timestamp into a string using a pattern.",
      schema: spec(
        z
          .object({
            value: DynamicValueSchema.describe("REF:#/$defs/DynamicValue|The date to format."),
            format: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|A Unicode TR35 date pattern string.\n\nToken Reference:\n- Year: 'yy' (26), 'yyyy' (2026)\n- Month: 'M' (1), 'MM' (01), 'MMM' (Jan), 'MMMM' (January)\n- Day: 'd' (1), 'dd' (01), 'E' (Tue), 'EEEE' (Tuesday)\n- Hour (12h): 'h' (1-12), 'hh' (01-12) - requires 'a' for AM/PM\n- Hour (24h): 'H' (0-23), 'HH' (00-23) - Military Time\n- Minute: 'mm' (00-59)\n- Second: 'ss' (00-59)\n- Period: 'a' (AM/PM)\n\nExamples:\n- 'MMM dd, yyyy' -> 'Jan 16, 2026'\n- 'HH:mm' -> '14:30' (Military)\n- 'h:mm a' -> '2:30 PM'\n- 'EEEE, d MMMM' -> 'Friday, 16 January'",
            ),
          })
          .strict(),
        { required: ["format", "value"], closure: "unevaluatedProperties" },
      ),
      execute: (args, context) =>
        formatDateValue(args.value, args.format, localeOf(context) || locale),
    },
    {
      name: "pluralize",
      returnType: "string",
      description:
        "Returns a localized string based on the Common Locale Data Repository (CLDR) plural category of the count (zero, one, two, few, many, other). Requires an 'other' fallback. For English, just use 'one' and 'other'.",
      schema: spec(
        z
          .object({
            value: DynamicNumberSchema.describe(
              "REF:#/$defs/DynamicNumber|The numeric value used to determine the plural category.",
            ),
            zero: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|String for the 'zero' category (e.g., 0 items).",
            ).optional(),
            one: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|String for the 'one' category (e.g., 1 item).",
            ).optional(),
            two: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|String for the 'two' category (used in Arabic, Welsh, etc.).",
            ).optional(),
            few: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|String for the 'few' category (e.g., small groups in Slavic languages).",
            ).optional(),
            many: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|String for the 'many' category (e.g., large groups in various languages).",
            ).optional(),
            other: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The default/fallback string (used for general plural cases).",
            ),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args, context) =>
        pluralizeValue(args.value, args as Record<string, unknown>, localeOf(context) || locale),
    },
    {
      name: "openUrl",
      returnType: "void",
      requiresUserActivation: true,
      description:
        "Opens the specified URL in a browser or handler (requires user activation). This function has no return value.",
      schema: spec(
        z
          .object({
            url: z
              .union([
                spec(
                  z.string().refine((v) => v.trim().length > 0 && !/\s/.test(v.trim()), "Invalid URI"),
                  { keywords: { format: "uri" } },
                ),
                DataBindingSchema.describe("REF:#/$defs/DataBinding"),
                FunctionCallSchema.describe("REF:#/$defs/FunctionCall"),
              ])
              .describe("The URL to open."),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => executeOpenUrl(args.url),
    },
    {
      name: "and",
      returnType: "boolean",
      description: "Performs a logical AND operation on a list of boolean values.",
      schema: spec(
        z
          .object({
            values: z
              .array(DynamicBooleanSchema.describe("REF:#/$defs/DynamicBoolean"))
              .min(2)
              .describe("The list of boolean values to evaluate."),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => (args.values as unknown[]).every(truthy),
    },
    {
      name: "or",
      returnType: "boolean",
      description: "Performs a logical OR operation on a list of boolean values.",
      schema: spec(
        z
          .object({
            values: z
              .array(DynamicBooleanSchema.describe("REF:#/$defs/DynamicBoolean"))
              .min(2)
              .describe("The list of boolean values to evaluate."),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => (args.values as unknown[]).some(truthy),
    },
    {
      name: "not",
      returnType: "boolean",
      description: "Performs a logical NOT operation on a boolean value.",
      schema: spec(
        z
          .object({
            value: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|The boolean value to negate.",
            ),
          })
          .strict(),
        { closure: "unevaluatedProperties" },
      ),
      execute: (args) => !truthy(args.value),
    },
  ];
}
