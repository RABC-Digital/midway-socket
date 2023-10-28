import { App, Configuration, ILifeCycle } from '@midwayjs/core';
import { Application } from '../../../../src';

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
  }
}
