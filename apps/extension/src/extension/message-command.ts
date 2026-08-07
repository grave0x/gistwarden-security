import { z } from "zod";
import type { RouteContract } from "@gistwarden/orchestrator";
import { isRecord } from "@gistwarden/repository";

export interface MessageContext {
  sender: chrome.runtime.MessageSender;
  isExtensionSender: boolean;
}

export interface MessageCommand<
  TPayload = unknown,
  TResponse = unknown,
> {
  readonly type: string;
  readonly payloadSchema?: z.ZodTypeAny;
  readonly responseSchema?: z.ZodTypeAny;
  readonly internalOnly?: boolean;
  execute(
    payload: TPayload,
    context: MessageContext,
  ): Promise<TResponse> | TResponse;
}

function isRouteContract(
  val: unknown,
): val is RouteContract<string, z.ZodTypeAny, z.ZodTypeAny> {
  return (
    isRecord(val) &&
    typeof val.type === "string" &&
    "payloadSchema" in val
  );
}

export function createCommand<
  TSchema extends z.ZodTypeAny,
  TResponse,
>(options: {
  type: string;
  schema?: TSchema;
  internalOnly?: boolean;
  execute: (
    payload: z.infer<TSchema>,
    context: MessageContext,
  ) => Promise<TResponse> | TResponse;
}): MessageCommand<z.infer<TSchema>, TResponse>;

export function createCommand<
  TType extends string,
  TPayloadSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
>(
  route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
  handler: (
    payload: z.infer<TPayloadSchema>,
    context: MessageContext,
  ) => Promise<z.infer<TResponseSchema>> | z.infer<TResponseSchema>,
): MessageCommand<z.infer<TPayloadSchema>, z.infer<TResponseSchema>>;

export function createCommand(
  routeOrOptions: unknown,
  handler?: unknown,
): MessageCommand {
  if (isRouteContract(routeOrOptions)) {
    const route = routeOrOptions;
    const fn = handler as (payload: unknown, context: MessageContext) => unknown;
    return {
      type: route.type,
      payloadSchema: route.payloadSchema,
      responseSchema: route.responseSchema,
      internalOnly: route.internalOnly,
      execute: fn,
    };
  }

  const opts = routeOrOptions as {
    type: string;
    schema?: z.ZodTypeAny;
    internalOnly?: boolean;
    execute: (payload: unknown, context: MessageContext) => unknown;
  };
  return {
    type: opts.type,
    payloadSchema: opts.schema,
    internalOnly: opts.internalOnly,
    execute: opts.execute,
  };
}
