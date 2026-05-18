//
// this is the entry point for the server
//

import './env.server'; // import this first
import handler from '@tanstack/react-start/server-entry';

export default {
  async fetch(request: Request): Promise<Response> {
    // you can also add custom middleware / logging here
    return handler.fetch(request);
  },
};
