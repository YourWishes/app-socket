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

import { RESPONSE_NOT_FOUND, RESPONSE_INTERNAL_ERROR } from '@yourwishes/app-api';
import { SocketModule } from './../module/';
import { Socket } from 'socket.io';
import { SocketAPIRequest, SocketAPIResponse, ERROR_PATH } from './../api/';

export abstract class SocketConnection {
  module:SocketModule;
  socket:Socket;

  constructor(module:SocketModule, socket:Socket) {
    if(module == null) throw new Error("Invalid Socket Module Provided");
    if(socket == null) throw new Error("Invalid Socket Provided");
    this.module = module;
    this.socket = socket;

    //Setup event listeners
    this.socket.on('disconnect', (reason) => this.onDisconnect(reason));
    this.socket.on('error', (error) => this.onError(error));

    //Start listening for events...
    this.socket.on('*', (data) => this.onRequest(data));
  }

  isConnected() { return this.socket && this.socket.connected && !this.socket.disconnected; }

  close() {
    if(!this.isConnected()) return;
    this.socket.disconnect(true);
  }

  //Events
  abstract onConnect():Promise<void>;
  abstract onDisconnect(reason:string):Promise<void>;

  async onRequest(request) {
    if(!request) return;
    if(!request.data) return;
    //Data comes from SocketIOWildcard middleware in the following format:
    //{ type: ?, nsp: namespace, data: [ path, { ...data } ] }
    let { data } = request;
    if(!data || data.length < 2) return;
    let [ path, d ] = data;//Where path is the path and d is the data

    //Prepare our request handler.
    let req = new SocketAPIRequest(this.module, path, this, d);

    //Now we have a seemingly valid request, let's go ahead and start the module handlers
    let handler = this.module.handlers.find(handler => handler.hasPath(path));

    //Prepare a response...
    let response:SocketAPIResponse;

    //Did we find a handler?
    if(!handler) {
      //No.
      response = {code: RESPONSE_NOT_FOUND, data: `Cannot find path ${path}`, path: ERROR_PATH };
    } else {
      //Yes, attempt to run
      try {
        response = await handler.onRequest(req);

        //Did we get a valid response?
        if(!response) throw new Error('Response never returned anything!');
      } catch(e) {
        //Error handling
        this.module.logger.severe('Socket API Handler Error!');
        this.module.logger.severe(e);
        response = {
          code: RESPONSE_INTERNAL_ERROR, data: `Server Error occured, try again later.`,
          path: ERROR_PATH
        };
      }
    }

    //Finally send data in a standard format.
    this.socket.emit(response.path, { code: response.code, data: response.data });
  }

  async onError(error:any):Promise<void> {
    this.module.logger.severe('Socket Error!');
    this.module.logger.severe(error);
    this.close();
  }
}
