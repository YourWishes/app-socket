import { App } from '@yourwishes/app-base';
import { ServerModule } from '@yourwishes/app-server';

import { Socket } from 'socket.io';

import { SocketModule } from './../module/';
import { SocketConnection } from './';
import { ISocketApp } from './../app/';

class DummyAppClass extends App implements ISocketApp {
  socket:SocketModule;
  server:ServerModule;

  socketCallback:()=>SocketConnection;

  constructor() {
    super();
  }

  acceptSocket(module:SocketModule, socket:Socket):SocketConnection {
    return null;
  }
}
class DummySocket {
  on() {}
};

class DummyConnection extends SocketConnection {
  async onConnect(): Promise<void> { }
  async onDisconnect(reason: string):Promise<void> { }
}

const app = new DummyAppClass();
app.server = new ServerModule(app);

describe('SocketConnection', () => {
  let module = new SocketModule(app);
  let socket:any = new DummySocket();

  it('should require a valid SocketModule', () => {
    expect(() => new DummyConnection(null, socket)).toThrow();
  });

  it('should require a valid Socket', () => {
    expect(() => new DummyConnection(module, null)).toThrow();
  });

  it('should be constructable', () => {
    expect(() => new DummyConnection(module, socket)).not.toThrow();
  });
});;
