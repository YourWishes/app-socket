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

import { SocketConnection } from './../socket/';
import { SocketRequest } from './SocketRequest';

export abstract class SocketHandler {
  connection:SocketConnection;
  paths:string[]=[];

  constructor(connection:SocketConnection, paths:string|string[]) {
    if(connection == null) throw new Error("Invalid connection supplied");
    if(!paths) throw new Error("Please supply a path, or multiple paths");

    //Array Validation
    if(!Array.isArray(paths)) paths = [ paths ];
    paths.forEach(path => {
      if(!path || !path.length) throw new Error("Path is not valid");
    });

    //Set Params.
    this.connection = connection;
    this.paths = paths;
  }

  hasPath(path:string) {return this.paths.indexOf(path) !== -1;}

  abstract onRequest(request:SocketRequest):Promise<void>;
}
