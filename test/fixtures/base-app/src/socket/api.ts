import { Inject, Provide } from '@midwayjs/core';
import {
  IMidwaySocketContext,
  OnSocketConnection,
  OnSocketData,
  OnSocketDisConnection,
  SocketController,
} from '../../../../../src';
import * as assert from 'assert';

@Provide()
@SocketController()
export class APIController {
  @Inject()
  ctx: IMidwaySocketContext;

  @OnSocketConnection()
  init(socket: IMidwaySocketContext) {
    console.log(`namespace / got a connection ${socket.readyState}`);
    assert(this.ctx.readyState === socket.readyState);
  }

  @OnSocketData('data')
  async gotMyMessage(data: Buffer) {
    return `${parseInt(data.toString()) + 5}`;
  }

  @OnSocketDisConnection()
  disconnect(id: number) {
    console.log('disconnect ' + id);
  }
}
