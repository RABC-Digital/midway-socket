import {
  BaseFramework,
  CommonMiddlewareUnion,
  ContextMiddlewareManager,
  Framework,
  IMidwayBootstrapOptions,
  MidwayFrameworkType,
  MidwayInvokeForbiddenError,
  Types,
  getClassMetadata,
  listModule,
} from '@midwayjs/core';
import * as net from 'net';
import {
  Application,
  Context,
  IMidwaySocketApplication,
  IMidwaySocketConfigurationOptions,
  IMidwaySocketContext,
  NextFunction,
  SocketControllerOption,
  SocketEventInfo,
} from './interface';
import {
  SOCKET_CONTROLLER_KEY,
  SOCKET_EVENT_KEY,
  SocketEventTypeEnum,
} from './constant';
import { debuglog } from 'util';
const debug = debuglog('midway:debug');

@Framework()
export class MidwaySocketFramework extends BaseFramework<
  Application,
  Context,
  IMidwaySocketConfigurationOptions
> {
  protected connectionMiddlewareManager = this.createMiddlewareManager();
  public app: IMidwaySocketApplication;

  configure(): IMidwaySocketConfigurationOptions {
    return this.configService.getConfiguration('socket');
  }

  applicationInitialize(options: IMidwayBootstrapOptions) {
    const { port, ...opts } = this.configurationOptions;

    this.app = net.createServer(opts) as IMidwaySocketApplication;
    this.app.clients = []; // 初始化Client数组

    this.defineApplicationProperties({
      useConnectionMiddleware: (
        middleware: CommonMiddlewareUnion<Context, NextFunction, undefined>
      ) => {
        return this.useConnectionMiddleware(middleware);
      },
      getConnectionMiddleware: (): ContextMiddlewareManager<
        Context,
        NextFunction,
        undefined
      > => {
        return this.getConnectionMiddleware();
      },
    });
  }

  protected async afterContainerReady(
    options: Partial<IMidwayBootstrapOptions>
  ): Promise<void> {
    await this.loadMidwayController();
  }

  public async run(): Promise<void> {
    const { port } = this.configurationOptions;
    return new Promise<void>(resolve => {
      this.app.listen(port, () => {
        this.logger.info(`[midway:socket] socket server started on ${port}`);
        resolve();
      });
    });
  }

  protected async beforeStop(): Promise<void> {
    // close all client
    this.app.clients.forEach(client => {
      client.destroy();
    });

    // clear clients
    this.app.clients = [];

    return new Promise<void>(resolve => {
      this.app.close(() => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    });
  }

  public getFrameworkType(): MidwayFrameworkType {
    return new MidwayFrameworkType('midway-socket');
  }

  private async loadMidwayController() {
    // create room
    const controllerModules = listModule(SOCKET_CONTROLLER_KEY);
    if (controllerModules.length > 0) {
      // ws just one namespace
      await this.addNamespace(controllerModules[0]);
    }
  }

  private async addNamespace(target: any) {
    const controllerOption: SocketControllerOption = getClassMetadata(
      SOCKET_CONTROLLER_KEY,
      target
    );
    const controllerMiddleware =
      controllerOption.routerOptions.middleware ?? [];
    const controllerConnectionMiddleware =
      controllerOption.routerOptions.connectionMiddleware ?? [];

    this.app.on('connection', async (socket: IMidwaySocketContext) => {
      // create request context
      this.app.createAnonymousContext(socket);
      socket.requestContext.registerObject('socket', socket);
      socket.app = this.app;

      // 将新客户端Socket连接添加到数组中
      this.app.clients.push(socket);

      // run connection middleware
      const connectFn = await this.middlewareService.compose(
        [
          ...this.connectionMiddlewareManager,
          ...controllerConnectionMiddleware,
        ],
        this.app
      );
      await connectFn(socket);

      const socketEventInfos: SocketEventInfo[] = getClassMetadata(
        SOCKET_EVENT_KEY,
        target
      );

      // 存储方法对应的响应处理
      const methodMap = {};

      if (socketEventInfos.length) {
        for (const socketEventInfo of socketEventInfos) {
          methodMap[socketEventInfo.propertyName] = methodMap[
            socketEventInfo.propertyName
          ] || { responseEvents: [] };
          const controller = await socket.requestContext.getAsync(target);

          // on connection
          if (socketEventInfo.eventType === SocketEventTypeEnum.ON_CONNECTION) {
            try {
              const fn = await this.middlewareService.compose(
                [
                  ...(socketEventInfo?.eventOptions?.middleware || []),
                  async (ctx, next) => {
                    const isPassed = await this.app
                      .getFramework()
                      .runGuard(ctx, target, socketEventInfo.propertyName);
                    if (!isPassed) {
                      throw new MidwayInvokeForbiddenError(
                        socketEventInfo.propertyName,
                        target
                      );
                    }

                    // eslint-disable-next-line prefer-spread
                    return controller[socketEventInfo.propertyName].apply(
                      controller,
                      [socket]
                    );
                  },
                ],
                this.app
              );
              const result = await fn(socket);

              await this.bindSocketResponse(
                result,
                socket,
                socketEventInfo.propertyName,
                methodMap
              );
            } catch (err) {
              this.logger.error(err);
            }
          } else if (
            socketEventInfo.eventType === SocketEventTypeEnum.ON_DATA
          ) {
            // on user custom event
            socket.on(socketEventInfo.messageEventName, async (...args) => {
              debug(
                '[midway:socket]: got message',
                socketEventInfo.messageEventName,
                args
              );

              try {
                const result = await (
                  await this.applyMiddleware(async (ctx, next) => {
                    // add controller middleware
                    const fn = await this.middlewareService.compose(
                      [
                        ...controllerMiddleware,
                        ...(socketEventInfo?.eventOptions?.middleware || []),
                        async (ctx, next) => {
                          // eslint-disable-next-line prefer-spread
                          return controller[socketEventInfo.propertyName].apply(
                            controller,
                            args
                          );
                        },
                      ],
                      this.app
                    );
                    return await fn(ctx, next);
                  })
                )(socket);
                if (typeof args[args.length - 1] === 'function') {
                  // ack
                  args[args.length - 1](result);
                } else {
                  // emit
                  await this.bindSocketResponse(
                    result,
                    socket,
                    socketEventInfo.propertyName,
                    methodMap
                  );
                }
              } catch (error) {
                this.logger.error(error);
              }
            });
          } else if (
            socketEventInfo.eventType === SocketEventTypeEnum.ON_DISCONNECTION
          ) {
            // on socket disconnect
            socket.on('end', async (reason: string) => {
              try {
                // 从数组中移除断开连接的客户端
                const index = this.app.clients.indexOf(socket);
                if (index !== -1) {
                  this.app.clients.splice(index, 1);
                }

                const result = await controller[
                  socketEventInfo.propertyName
                ].apply(controller, [reason]);
                await this.bindSocketResponse(
                  result,
                  socket,
                  socketEventInfo.propertyName,
                  methodMap
                );
              } catch (err) {
                this.logger.error(err);
              }
            });
          } else {
            // 存储每个方法对应的后置响应处理，供后续快速匹配
            methodMap[socketEventInfo.propertyName].responseEvents.push(
              socketEventInfo
            );
          }
        }
      }
    });

    this.app.on('error', err => {
      this.logger.error('[midway:socket] socket server close', err);
    });

    this.app.on('close', () => {
      this.logger.info('[midway:socket] socket server close');
    });
  }

  private async bindSocketResponse(
    result: any,
    socket: IMidwaySocketContext,
    propertyName: string,
    methodMap: {
      responseEvents?: SocketEventInfo[];
    }
  ) {
    if (!result) return;
    if (methodMap[propertyName]) {
      for (const wsEventInfo of methodMap[propertyName].responseEvents) {
        if (wsEventInfo.eventType === SocketEventTypeEnum.EMIT) {
          socket.write(formatResult(result));
        } else if (wsEventInfo.eventType === SocketEventTypeEnum.BROADCAST) {
          this.app.clients.forEach(client => {
            client.write(formatResult(result));
          });
        }
      }
      if (methodMap[propertyName].responseEvents.length === 0) {
        // no emit decorator
        socket.write(formatResult(result));
      }
    } else {
      // just send
      socket.write(formatResult(result));
    }
  }

  public getFrameworkName() {
    return 'midway:socket';
  }

  public useConnectionMiddleware(
    middleware: CommonMiddlewareUnion<Context, NextFunction, undefined>
  ) {
    this.connectionMiddlewareManager.insertLast(middleware);
  }

  public getConnectionMiddleware(): ContextMiddlewareManager<
    Context,
    NextFunction,
    undefined
  > {
    return this.connectionMiddlewareManager;
  }
}

function formatResult(result: any): Uint8Array | string {
  return Types.isObject(result) ? JSON.stringify(result) : result;
}
