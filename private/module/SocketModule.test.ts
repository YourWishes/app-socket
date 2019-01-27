import 'jest';
import { App } from '@yourwishes/app-base';
import { ServerModule } from '@yourwishes/app-server';

import { Socket } from 'socket.io';

import { SocketModule } from './SocketModule';
import { ISocketApp } from './../app/';
import { SocketConnection } from './../connection';
import { SocketAPIHandler } from './../api/';

//Dummy App class
class DummyAppClass extends App implements ISocketApp {
  socket:SocketModule;
  server:ServerModule;

  socketCallback:()=>SocketConnection;

  constructor() {
    super();
  }

  async acceptSocket(module:SocketModule, socket:Socket):Promise<SocketConnection> {
    return this.socketCallback ? this.socketCallback() : null;
  }
}

//Dummy SocketAPIHandler class
class DummySocketHandler extends SocketAPIHandler {
  async onRequest() { return null; }
}

const app = new DummyAppClass();
app.server = new ServerModule(app);
app.addModule(app.server);


describe('SocketModule', () => {
  it('should require a reall app with a real server', () => {
    expect(() => new SocketModule(null)).toThrow();

    let dummy = new DummyAppClass();
    expect(() => new SocketModule(dummy)).toThrow();
  });

  it('should construct', () => {
    expect(() => new SocketModule(app)).not.toThrow();
  });

  it('should modify the server to turn off autostart', () => {
    let app = new DummyAppClass();
    app.server = new ServerModule(app);
    app.addModule(app.server);

    expect(app.server.autoStart).toStrictEqual(true);
    let module = new SocketModule(app);
    expect(app.server.autoStart).toStrictEqual(false);
    expect(module.autoStartServer).toStrictEqual(true);
  });

  it('should retain the server autostart', () => {
    let app = new DummyAppClass();
    app.server = new ServerModule(app);
    app.addModule(app.server);

    app.server.autoStart = false;
    let module = new SocketModule(app);
    expect(app.server.autoStart).toStrictEqual(false);
    expect(module.autoStartServer).toStrictEqual(false);
  });
});

describe('addHandler', () => {
  it('should require a real SocketAPIHandler', () => {
    let module = new SocketModule(app);
    expect(() => module.addHandler(null)).toThrow();
  });

  it('should add a socket handler to the array', () => {
    let module = new SocketModule(app);
    expect(module.handlers).toHaveLength(0);

    let handler = new DummySocketHandler(module, '/test');
    expect(() => module.addHandler(handler)).not.toThrow();
    expect(module.handlers).toHaveLength(1);
    expect(module.handlers).toContain(handler);

    let handler2 = new DummySocketHandler(module, '/ping');
    module.addHandler(handler2);
    expect(module.handlers).toHaveLength(2);
    expect(module.handlers).toContain(handler);
    expect(module.handlers).toContain(handler2);
  });

  it('should not add the same handler twice', () => {
    let module = new SocketModule(app);
    let handler = new DummySocketHandler(module, '/test');
    module.addHandler(handler);
    expect(module.handlers).toHaveLength(1);
    module.addHandler(handler);
    expect(module.handlers).toHaveLength(1);
  });
});

describe('removeHandler', () => {
  it('should require a real SocketAPIHandler', () => {
    let module = new SocketModule(app);
    expect(() => module.removeHandler(null)).toThrow();
  });

  it('should remove the handler from the array', () => {
    let module = new SocketModule(app);
    let handler = new DummySocketHandler(module, '/test');
    module.addHandler(handler);
    expect(module.handlers).toContain(handler);
    expect(() => module.removeHandler(handler)).not.toThrow();
    expect(module.handlers).not.toContain(handler);
  });

  it('should do nothing if the handler is not in the array', () => {
    let module = new SocketModule(app);
    let handler = new DummySocketHandler(module, '/test');
    let handler2 = new DummySocketHandler(module, '/test2');
    module.addHandler(handler);
    expect(module.handlers).toHaveLength(1);
    expect(() => module.removeHandler(handler2)).not.toThrow();
    expect(module.handlers).toHaveLength(1);
  });
});

describe('init', () => {
  it('should require the app to not be listening', async () => {
    let app = new DummyAppClass();
    app.server = new ServerModule(app);
    app.server[`${'http'}`] = { listening: true };

    let module = new SocketModule(app);
    await expect(module.init()).rejects.toThrow();
  });
});

/*
  Don't have a way of testing at the moment
describe('onConnection', () => {
});
*/
