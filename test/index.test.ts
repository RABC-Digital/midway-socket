import { once } from 'events';
import { sleep } from '@midwayjs/core';
import { closeApp, createServer, createSocketClient } from './utils';

describe('/test/index.test.ts', () => {
  it('should test create socket app', async () => {
    const app = await createServer('base-app');
    const client = await createSocketClient('127.0.0.1', 8090);
    let gotEvent = once(client, 'data');

    client.write('1');
    let [data] = await gotEvent;
    expect(data.toString()).toEqual('6');

    client.write('2');
    gotEvent = once(client, 'data');
    [data] = await gotEvent;
    expect(data.toString()).toEqual('7');

    await sleep(1000);
    client.end();
    await closeApp(app);
  });


  it('should test create socket and with filter', async () => {
    const app = await createServer('base-app-filter');
    const client = await createSocketClient('127.0.0.1', 8090);

    client.write('1');
    const gotEvent = once(client, 'data');
    const [data] = await gotEvent;
    expect(data.toString()).toEqual('packet error');

    await sleep();

    await client.end();
    await closeApp(app);
  });
});
