import { Configuration } from '@midwayjs/core';

@Configuration({
  namespace: 'socket',
  importConfigs: [
    {
      default: {
        socket: {},
      },
    },
  ],
})
export class SocketConfiguration {}
