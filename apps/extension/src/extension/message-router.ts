import { isRecord } from "@gistwarden/domain";
import {
  onExtensionMessage,
  type RouteContract,
} from "@gistwarden/orchestrator";
import type { z } from "zod";
import { getAssetUrl } from "@/core/runtime.ts";
import type {
  MessageCommand,
  MessageContext,
} from "@/extension/message-command.ts";
import { createCommand } from "@/extension/message-command.ts";

export type {
  MessageCommand,
  MessageContext,
} from "@/extension/message-command.ts";
export { createCommand } from "@/extension/message-command.ts";

export type MiddlewareContext = {
  rawMessage: unknown;
  sender: chrome.runtime.MessageSender;
  command: MessageCommand<unknown, unknown>;
  isExtensionSender: boolean;
  validatedPayload: unknown;
};

export type MessageMiddleware = (
  ctx: MiddlewareContext,
  next: () => Promise<unknown>,
) => Promise<unknown>;

export class ExtensionMessagePipeline {
  private middlewares: MessageMiddleware[] = [];

  use(middleware: MessageMiddleware): void {
    this.middlewares.push(middleware);
  }

  async execute(ctx: MiddlewareContext): Promise<unknown> {
    let index = 0;
    const next = async (): Promise<unknown> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        if (middleware) {
          return await middleware(ctx, next);
        }
      }
      return await ctx.command.execute(ctx.validatedPayload, {
        sender: ctx.sender,
        isExtensionSender: ctx.isExtensionSender,
      });
    };
    return await next();
  }
}

export class MessageRouter {
  private commands = new Map<string, MessageCommand<unknown, unknown>>();
  private pipeline = new ExtensionMessagePipeline();

  constructor() {
    // 1. Authorization Middleware Stage
    this.pipeline.use(async (ctx, next) => {
      if (ctx.command.internalOnly && !ctx.isExtensionSender) {
        console.warn(
          `[MessageRouter] Unauthorized message from sender:`,
          ctx.sender.url || ctx.sender.id,
        );
        return { success: false, error: "Unauthorized sender context" };
      }
      return await next();
    });

    // 2. Payload Validation Middleware Stage
    this.pipeline.use(async (ctx, next) => {
      if (ctx.command.payloadSchema) {
        const parseRes = ctx.command.payloadSchema.safeParse(ctx.rawMessage);
        if (!parseRes.success) {
          console.warn(
            `[MessageRouter] Schema validation failed:`,
            parseRes.error,
          );
          return { success: false, error: "Invalid message payload" };
        }
        ctx.validatedPayload = parseRes.data;
      }
      return await next();
    });
  }

  registerCommand<TPayload, TResponse>(
    command: MessageCommand<TPayload, TResponse>,
  ): this {
    this.commands.set(command.type, command);
    return this;
  }

  registerCommands(commands: MessageCommand[]): this {
    for (const cmd of commands) {
      this.registerCommand(cmd);
    }
    return this;
  }

  register<
    TType extends string,
    TPayloadSchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
  >(
    route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
    handler: (
      payload: z.infer<TPayloadSchema>,
      context: MessageContext,
    ) => Promise<z.infer<TResponseSchema>> | z.infer<TResponseSchema>,
  ): this {
    return this.registerCommand(createCommand(route, handler));
  }

  use(pluginFn: (router: MessageRouter) => void): this {
    pluginFn(this);
    return this;
  }

  hasRoute(type: string): boolean {
    return this.commands.has(type);
  }

  listen(): void {
    onExtensionMessage(
      (
        rawMessage: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
      ) => {
        if (
          isRecord(rawMessage) &&
          typeof rawMessage.type === "string" &&
          this.hasRoute(rawMessage.type)
        ) {
          void this.handleMessage(rawMessage, sender).then((res) => {
            if (res.handled) {
              sendResponse(res.response);
            }
          });
          return true;
        }
        return false;
      },
    );
  }

  async handleMessage(
    rawMessage: unknown,
    sender: chrome.runtime.MessageSender,
  ): Promise<{ handled: boolean; response?: unknown }> {
    if (!isRecord(rawMessage) || typeof rawMessage.type !== "string") {
      return { handled: false };
    }

    const command = this.commands.get(rawMessage.type);
    if (!command) {
      return { handled: false };
    }

    const extensionPageOrigin = getAssetUrl("");
    const isExtensionUrl = Boolean(
      extensionPageOrigin.length > 0 &&
        sender.url &&
        sender.url.startsWith(extensionPageOrigin),
    );
    const isExtensionRuntime = Boolean(
      typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.id &&
        sender.id === chrome.runtime.id &&
        !sender.tab,
    );
    const isExtensionSender = isExtensionUrl || isExtensionRuntime;

    const ctx: MiddlewareContext = {
      rawMessage,
      sender,
      command,
      isExtensionSender,
      validatedPayload: rawMessage,
    };

    const response = await this.pipeline.execute(ctx);
    return { handled: true, response };
  }
}
