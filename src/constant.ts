// Socket
export const SOCKET_CONTROLLER_KEY = 'socket:controller';

export const SOCKET_EVENT_KEY = 'socket:event';

export enum SocketEventTypeEnum {
  ON_CONNECTION = 'socket:onConnection',
  ON_DISCONNECTION = 'socket:onDisConnection',
  ON_DATA = 'socket:onData',
  ON_SOCKET_ERROR = 'socket:onSocketError',
  EMIT = 'socket:emit',
  BROADCAST = 'socket:broadcast',
}
