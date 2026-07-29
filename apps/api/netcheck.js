const net = require('net');
const dns = require('dns');

function testConnect(host, port, label) {
      return new Promise((resolve) => {
              const start = Date.now();
              const socket = net.createConnection({ host, port, timeout: 8000 });
              socket.on('connect', () => {
                        console.log('[NETCHECK] ' + label + ' (' + host + ':' + port + ') -> CONNECTED in ' + (Date.now() - start) + 'ms');
                        socket.end();
                        resolve();
              });
              socket.on('timeout', () => {
                        console.log('[NETCHECK] ' + label + ' (' + host + ':' + port + ') -> TIMEOUT after ' + (Date.now() - start) + 'ms');
                        socket.destroy();
                        resolve();
              });
              socket.on('error', (err) => {
                        console.log('[NETCHECK] ' + label + ' (' + host + ':' + port + ') -> ERROR after ' + (Date.now() - start) + 'ms: ' + err.message);
                        resolve();
              });
      });
}

function testSslNegotiation(host, port, label) {
      return new Promise((resolve) => {
              const start = Date.now();
              const socket = net.createConnection({ host, port, timeout: 8000 });
              let gotData = false;
              socket.on('connect', () => {
                        const buf = Buffer.alloc(8);
                        buf.writeInt32BE(8, 0);
                        buf.writeInt32BE(80877103, 4);
                        socket.write(buf);
                        console.log('[NETCHECK-SSL] ' + label + ' SSLRequest sent at ' + (Date.now() - start) + 'ms');
              });
              socket.on('data', (data) => {
                        gotData = true;
                        console.log('[NETCHECK-SSL] ' + label + ' RESPONSE byte: ' + JSON.stringify(data.toString()) + ' after ' + (Date.now() - start) + 'ms');
                        socket.destroy();
                        resolve();
              });
              socket.on('timeout', () => {
                        console.log('[NETCHECK-SSL] ' + label + ' NO RESPONSE (timeout) after ' + (Date.now() - start) + 'ms, gotData=' + gotData);
                        socket.destroy();
                        resolve();
              });
              socket.on('error', (err) => {
                        console.log('[NETCHECK-SSL] ' + label + ' ERROR after ' + (Date.now() - start) + 'ms: ' + err.message);
                        resolve();
              });
              socket.on('close', () => {
                        if (!gotData) {
                                    console.log('[NETCHECK-SSL] ' + label + ' CLOSED with no data after ' + (Date.now() - start) + 'ms');
                        }
                        resolve();
              });
      });
}

function testDns(host) {
      return new Promise((resolve) => {
              dns.lookup(host, { all: true, verbatim: true }, (err, addresses) => {
                        if (err) {
                                    console.log('[NETCHECK] DNS lookup ' + host + ' -> ERROR: ' + err.message);
                        } else {
                                    console.log('[NETCHECK] DNS lookup ' + host + ' -> ' + JSON.stringify(addresses));
                        }
                        resolve();
              });
      });
}

async function main() {
      console.log('[NETCHECK] Starting network diagnostics...');
      await testDns('aws-0-eu-west-1.pooler.supabase.com');
      await testConnect('aws-0-eu-west-1.pooler.supabase.com', 6543, 'transaction-pooler');
      await testConnect('aws-0-eu-west-1.pooler.supabase.com', 5432, 'session-pooler');
      await testSslNegotiation('aws-0-eu-west-1.pooler.supabase.com', 6543, 'ssl-transaction-pooler');
      await testSslNegotiation('aws-0-eu-west-1.pooler.supabase.com', 5432, 'ssl-session-pooler');
      console.log('[NETCHECK] Diagnostics complete.');
      process.exit(0);
}

main();
