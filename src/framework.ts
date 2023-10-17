import {
  BaseFramework,
  CommonMiddlewareUnion,
  Context,
  ContextMiddlewareManager,
  Framework,
  IMidwayBootstrapOptions,
  NextFunction,
} from '@midwayjs/core';
import * as net from 'net';
import {
  Application,
  IMidwaySocketApplication,
  IMidwaySocketConfigurationOptions,
} from './interface';

@Framework()
export class MidwaySocketFramework extends BaseFramework<
  Application,
  Context,
  IMidwaySocketConfigurationOptions
> {
  protected connectionMiddlewareManager = this.createMiddlewareManager();

  configure(): IMidwaySocketConfigurationOptions {
    return this.configService.getConfiguration('socket');
  }

  applicationInitialize(options: IMidwayBootstrapOptions) {
    const { port, ...opts } = this.configurationOptions;

    this.app = net.createServer(opts) as IMidwaySocketApplication;

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

  public app: IMidwaySocketApplication;

  protected async afterContainerReady(
    options: Partial<IMidwayBootstrapOptions>
  ): Promise<void> {
    await this.loadMidwayController();
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
