import {
  CommonMiddlewareUnion,
  ContextMiddlewareManager,
  IConfigurationOptions,
  IMidwayApplication,
  IMidwayContext,
  NextFunction as BaseNextFunction,
  MiddlewareParamArray,
} from '@midwayjs/core';
import * as net from 'net';
import { SocketEventTypeEnum } from './constant';

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
    clients: net.Socket[];
  }
> &
  net.Server;

export type IMidwaySocketConfigurationOptions = {
  port?: number;
} & Partial<net.ServerOpts> &
  IConfigurationOptions;

export type IMidwaySocketContext = IMidwayContext<
  net.Socket & {
    app: IMidwaySocketApplication;
    id?: string; // 新增一个用于用户自定义的id
  }
>;

export type Application = IMidwaySocketApplication;
export type NextFunction = BaseNextFunction;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Context extends IMidwaySocketContext {}

export interface SocketControllerOption {
  namespace: string;
  routerOptions: {
    connectionMiddleware?: MiddlewareParamArray;
    middleware?: MiddlewareParamArray;
  };
}

export interface SocketEventInfo {
  /**
   * socket event name in enum
   */
  eventType: SocketEventTypeEnum;
  /**
   * decorator method name
   */
  propertyName: string;
  descriptor: PropertyDescriptor;
  /**
   * the event name by user definition
   */
  messageEventName?: string;
  /**
   * the client id to emit
   */
  clientId?: string[];
  /**
   * event options, like middleware
   */
  eventOptions?: {
    middleware?: MiddlewareParamArray;
  };
}
