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

import * as SocketIOClient from 'socket.io-client';
import * as SocketIOWildcard from 'socketio-wildcard';

import { SocketHandler, SocketRequest } from './../api/';
import { ReloadHandler } from './../handlers';

const patch = SocketIOWildcard(SocketIOClient.Manager);

export class SocketConnection {
  socket:SocketIOClient.Socket;
  handlers:SocketHandler[]=[];

  constructor(path:string='/socket') {
    this.socket = SocketIOClient({ path });
    patch(this.socket);

    this.socket.on('connection', () => this.onConnected());
    this.socket.on('disconnect', reason => this.onDisconnect(reason));

    this.socket.on('*', (req) => this.onRequest(req));

    this.handlers.push(new ReloadHandler(this));
  }

  async onRequest(req:any) {
    //Req comes in a standard format like so:
    //{ type: ?, nsp: namespace, data: [ path, data ] }
    if(!req || !req.data) return;//Invalid request, ignore

    let [ path, response ] = req.data;
    if(!path || !path.length) return;

    //Now we can actually count this as a semi-valid request.
    let { code, data} = response;
    if(!code) return console.error("Got a response, however it did not have a code.");

    //Now let's handle the request as you expect.
    let handler = this.handlers.find(handler => handler.hasPath(path));
    if(!handler) return console.error(`Heard ${path} but do not have a handler setup.`);

    let request = new SocketRequest(this, path, code, data);
    try {
      await handler.onRequest(request);
    } catch(e) {
      console.error('Error handling socket request');
      console.error(e);
    }
  }

  onConnected() {
    console.log('Connected to server');
  }

  onDisconnect(reason:string) {
    console.log('Disconnected from server:');
    console.log(reason);
  }
}
