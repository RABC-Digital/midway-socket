import {
  MiddlewareParamArray,
  Provide,
  Scope,
  ScopeEnum,
  attachClassMetadata,
  saveClassMetadata,
  saveModule,
} from '@midwayjs/core';
import {
  SOCKET_CONTROLLER_KEY,
  SOCKET_EVENT_KEY,
  SocketEventTypeEnum,
} from './constant';
import { SocketControllerOption } from './interface';

export function SocketController(
  namespace: string | RegExp = '/',
  routerOptions: SocketControllerOption['routerOptions'] = {
    middleware: [],
    connectionMiddleware: [],
  }
): ClassDecorator {
  return (target: any) => {
    saveModule(SOCKET_CONTROLLER_KEY, target);
    saveClassMetadata(
      SOCKET_CONTROLLER_KEY,
      {
        namespace,
        routerOptions,
      } as SocketControllerOption,
      target
    );
    Scope(ScopeEnum.Request)(target);
    Provide()(target);
  };
}

export function OnSocketConnection(
  eventOptions: {
    middleware?: MiddlewareParamArray;
  } = {}
): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    attachClassMetadata(
      SOCKET_EVENT_KEY,
      {
        eventType: SocketEventTypeEnum.ON_CONNECTION,
        propertyName: propertyKey,
        eventOptions,
        descriptor,
      },
      target.constructor
    );
  };
}

export function OnSocketDisConnection(): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    attachClassMetadata(
      SOCKET_EVENT_KEY,
      {
        eventType: SocketEventTypeEnum.ON_DISCONNECTION,
        propertyName: propertyKey,
        descriptor,
      },
      target.constructor
    );
  };
}

export function OnSocketData(
  eventName: string,
  eventOptions: {
    middleware?: MiddlewareParamArray;
  } = {}
): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    attachClassMetadata(
      SOCKET_EVENT_KEY,
      {
        eventType: SocketEventTypeEnum.ON_DATA,
        messageEventName: eventName,
        propertyName: propertyKey,
        eventOptions,
        descriptor,
      },
      target.constructor
    );
  };
}

export function SocketEmit(messageName: string): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    attachClassMetadata(
      SOCKET_EVENT_KEY,
      {
        eventType: SocketEventTypeEnum.EMIT,
        propertyName: propertyKey,
        messageEventName: messageName,
        descriptor,
      },
      target.constructor
    );
  };
}

export function SocketBroadCast(messageName = ''): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    attachClassMetadata(
      SOCKET_EVENT_KEY,
      {
        eventType: SocketEventTypeEnum.BROADCAST,
        propertyName: propertyKey,
        messageEventName: messageName,
        descriptor,
      },
      target.constructor
    );
  };
}
