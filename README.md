# midway framework for Sokcet

[![Package Quality](http://npm.packagequality.com/shield/midway-socket.svg)](http://packagequality.com/#?package=midway-socket)


[Socket](https://nodejs.org/dist/latest/docs/api/net.html#class-netserver) 模块是 Node 端的一个 Socket 协议的实现，该协议允许客户端(一般是浏览器)持久化和服务端的连接。
这种可以持续连接的特性使得 Socket 特别适合用于适合用于IOT等使用场景。

本模块参考了 Midway Websocket的封装，能够简单的创建一个 Socket 服务。

相关信息：

**提供服务**

| 描述              |      |
| ----------------- | ---- |
| 可用于标准项目    | ✅    |
| 可用于 Serverless | ❌    |
| 可用于一体化      | ✅    |
| 包含独立主框架    | ❌    |
| 包含独立日志      | ❌    |

## 安装依赖


在现有项目中安装 WebSocket 的依赖。
```bash
$ npm i midway-socket --save
```

或者在 `package.json` 中增加如下依赖后，重新安装。

```json
{
  "dependencies": {
    "midway-socket": "^3.0.0",
    // ...
  },
}
```

## 开启组件

`midway-socket` 可以作为独立主框架使用。

```typescript
// src/configuration.ts
import { Configuration } from '@midwayjs/core';
import * as socket from 'midway-socket';

@Configuration({
  imports: [socket],
  // ...
})
export class MainConfiguration {
  async onReady() {
		// ...
  }
}

```

也可以附加在其他的主框架下，比如 `@midwayjs/koa` 。

```typescript
// src/configuration.ts
import { Configuration } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as socket from 'midway-socket';

@Configuration({
  imports: [koa, socket],
  // ...
})
export class MainConfiguration {
  async onReady() {
		// ...
  }
}

```



## 目录结构


下面是 WebSocket 项目的基础目录结构，和传统应用类似，我们创建了 `socket` 目录，用户存放 WebSocket 业务的服务代码。
```
.
├── package.json
├── src
│   ├── configuration.ts          ## 入口配置文件
│   ├── interface.ts
│   └── socket                    ## socket 服务的文件
│       └── hello.controller.ts
├── test
├── bootstrap.js                  ## 服务启动入口
└── tsconfig.json
```



## 提供 Socket 服务


Midway 通过 `@SocketController` 装饰器定义 Socket 服务。
```typescript
import { SocketController } from 'midway-socket';

@SocketController()
export class HelloSocketController {
  // ...
}
```
当有客户端连接时，会触发 `connection` 事件，我们在代码中可以使用 `@OnSocketConnection()` 装饰器来修饰一个方法，当每个客户端第一次连接服务时，将自动调用该方法。
```typescript
import { Inject } from '@midwayjs/core';
import { Context, OnSocketConnection, SocketController } from 'midway-socket';

@SocketController()
export class HelloSocketController {

  @Inject()
  ctx: Context;

  @OnSocketConnection()
  async onConnectionMethod(socket: Context) {
    console.log(`namespace / got a connection ${this.ctx.readyState}`);
  }
}

```

:::info
这里的 ctx 等价于 net.Socket 实例。
:::


## 消息和响应


Socket 是通过事件的监听方式来获取数据。Midway 提供了 `@OnSocketData()` 装饰器来格式化接收到的事件，每次客户端发送事件，被修饰的方法都将被执行。
```typescript
import { Inject } from '@midwayjs/core';
import { Context, OnSocketData, SocketController } from 'midway-socket';

@SocketController()
export class HelloSocketController {

  @Inject()
  ctx: Context;

  @OnSocketData('data')
  async gotMessage(data: Buffer) {
    return `${parseInt(data.toString()) + 5}`;
  }
}

```


## 配置

## 默认配置

`midway-socket` 的配置样例如下：

```typescript
// src/config/config.default
export default {
  // ...
  socket: {
    port: 8090,
  },
}
```

| 属性   | 类型       | 描述                                                         |
| --- | --- | --- |
| port | number | 可选，Socket server端口。 |

## License

[MIT]((http://github.com/midwayjs/midway/blob/master/LICENSE))
