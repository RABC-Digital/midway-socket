import { Configuration } from '@midwayjs/core';

@Configuration({
  namespace: 'socket',
  importConfigs: [
    {
      default: {
        socket: {
          port: 8090,
        },
      },
    },
  ],
})
export class SocketConfiguration {}
