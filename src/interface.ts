import {
  CommonMiddlewareUnion,
  ContextMiddlewareManager,
  IConfigurationOptions,
  IMidwayApplication,
  IMidwayContext,
  NextFunction as BaseNextFunction,
} from '@midwayjs/core';
import * as net from 'net';

export type IMidwaySocketApplication = IMidwayApplication<
  IMidwaySocketContext,
  {
    useConnectionMiddleware: (
      middleware: CommonMiddlewareUnion<Context, NextFunction, undefined>
    ) => void;
    getConnectionMiddleware: ContextMiddlewareManager<
      Context,
      NextFunction,
      undefined
    >;
  }
> &
  net.Server;

export type IMidwaySocketConfigurationOptions = {
  port?: number;
} & Partial<net.ServerOpts> &
  IConfigurationOptions;

export type IMidwaySocketContext = IMidwayContext<{
  app: IMidwaySocketApplication;
}>;

export type Application = IMidwaySocketContext;
export type NextFunction = BaseNextFunction;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Context extends IMidwaySocketContext {}
