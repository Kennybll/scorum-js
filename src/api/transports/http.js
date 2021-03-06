import fetch from 'cross-fetch';
import newDebug from 'debug';
import Transport from './base';

const debug = newDebug('scorum:http');

class RPCError extends Error {
  constructor(rpcError) {
    super(rpcError.message);
    this.name = 'RPCError';
    this.code = rpcError.code;
    this.data = rpcError.data;
  }
}

export function jsonRpc(uri, { method, id, params }) {
  const payload = { id, jsonrpc: '2.0', method, params };
  return fetch(uri, {
    body: JSON.stringify(payload),
    method: 'post',
    mode: 'cors',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    }
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then((rpcRes) => {
      if (rpcRes.id !== id) {
        throw new Error(`Invalid response id: ${rpcRes.id}`);
      }
      if (rpcRes.error) {
        throw new RPCError(rpcRes.error);
      }
      return rpcRes.result;
    });
}

export default class HttpTransport extends Transport {
  send(api, data, callback) {
    const _api = this.options.useAppbaseApi ? 'condenser_api' : api;
    debug('Scorum::send', api, data);
    /* eslint-disable-next-line */
    const id = data.id || this.id++;
    const params = [_api, data.method, data.params];
    jsonRpc(this.options.uri, { method: 'call', id, params }).then(
      (res) => {
        callback(null, res);
      },
      (err) => {
        callback(err);
      }
    );
  }
}
