// Copyright (c) 2019 Dominic Masters
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { Module } from '@yourwishes/app-base';
import { ISocketApp } from './../app/';
import * as SocketIO from 'socket.io';
import { Socket, Server } from 'socket.io';
import * as SocketIOWildcard from 'socketio-wildcard';

import { SocketConnection } from './../connection/';
import { SocketAPIHandler } from './../api/';

export class SocketModule extends Module {
  app:ISocketApp;
  autoStartServer:boolean;
  path:string;
  server:Server;

  sockets:SocketConnection[] = [];
  handlers:SocketAPIHandler[] = [];

  constructor(app:ISocketApp, path:string='/socket') {
    super(app);
    if(!app.server) throw new Error("SocketModule requires ServerModule to be setup.");

    this.path = path;

    //Hijack autostart, SocketIO needs to load first.
    this.autoStartServer = app.server.autoStart;
    app.server.autoStart = false;
  }

  addHandler(handler:SocketAPIHandler) {
    if(handler == null) throw new Error("Invalid Handler Supplied");
    if(this.handlers.indexOf(handler) !== -1) return;
    this.handlers.push(handler);
  }

  removeHandler(handler:SocketAPIHandler) {
    if(handler == null) throw new Error("Invalid Handler Supplied");
    let index = this.handlers.indexOf(handler);
    if(index === -1) return;
    this.handlers.splice(index, 1);
  }

  async init():Promise<void> {
    //SocketIO won't work for an already listening server... that being said we can hijack it a bit
    if(this.app.server.http.listening) throw new Error("Server is already listening, Socket cannot attach to a listening server.");

    //Prepare server
    this.server = SocketIO(this.app.server.http, {
      path: this.path,
      serveClient: false
    });

    //Setup wildcard middleware
    this.server.use(SocketIOWildcard());

    //Attach to server
    this.server.attach(this.app.server.http);
    if(this.app.server.https) this.server.attach(this.app.server.https);

    this.server.on('connection', socket => this.onConnection(socket));

    //Now we can start the server.
    if(this.autoStartServer) await this.app.server.start();
  }

  async onConnection(socket:Socket) {
    //Socket has attempted to connect, we need to allow the app to validate.
    let connection:SocketConnection = null;
    try {
      connection = this.app.acceptSocket(this, socket);
      await connection.onConnect();
    } catch(e) {
      this.logger.severe('Failed to accept socket!');
      this.logger.severe(e);
      connection = null;
    }

    //Close if not connected...
    if(!connection) return socket.disconnect(true);

    //Socket connected successfully.
    this.sockets.push(connection);
  }
}
