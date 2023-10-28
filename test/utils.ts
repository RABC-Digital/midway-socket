import { join } from 'path';
import * as socket from '../src';
import {
  Framework,
  IMidwaySocketApplication,
  IMidwaySocketConfigurationOptions,
} from '../src';
import { Socket } from 'net';
import { close, createApp } from '@midwayjs/mock';

/**
 * create a Sokcet app
 * @param name
 * @param options
 */
export async function createServer(
  name: string,
  options: IMidwaySocketConfigurationOptions = {}
): Promise<IMidwaySocketApplication> {
  return createApp<Framework>(
    join(__dirname, 'fixtures', name),
    options,
    socket
  );
}

export async function closeApp(app) {
  return close(app);
}

export async function createSocketClient(address: string, port: number) {
  const client = new Socket();

  return new Promise<Socket>(resolve => {
    client.connect(port, address);
    client.on('connect', () => {
      resolve(client);
    });
  });
}
