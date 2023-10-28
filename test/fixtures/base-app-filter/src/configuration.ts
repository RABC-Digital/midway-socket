import { App, Catch, Configuration, ILifeCycle } from '@midwayjs/core';
import { Application, Context } from '../../../../src';
import { PacketMiddleware } from './middleware/conn.middleware';

@Catch()
export class DefaultFilter {
  async catch(err: Error, ctx: Context) {
    console.log(ctx.readyState);
    return err.message;
  }
}

@Configuration({
  imports: [
    require('../../../../src')
  ],
  importConfigs: [
    {
      default: {
        socket: {
          port: 8090
        }
      }
    }
  ]
})
export class AutoConfiguration implements ILifeCycle {
  @App('socket')
  app: Application;

  async onReady() {
    this.app.useMiddleware(PacketMiddleware);
    this.app.useFilter(DefaultFilter)
  }
}
