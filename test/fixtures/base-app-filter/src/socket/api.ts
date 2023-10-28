import { Inject, Provide } from '@midwayjs/core';
import {
  IMidwaySocketContext,
  OnSocketData,
  SocketController,
} from '../../../../../src';

@Provide()
@SocketController()
export class APIController {
  @Inject()
  ctx: IMidwaySocketContext;

  @OnSocketData('data')
  async gotMyMessage() {
    throw new Error('custom error');
  }
}
