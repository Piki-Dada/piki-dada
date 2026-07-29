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


            function buildStartupMessage(user, database) {
                    const params = Buffer.concat([
                              Buffer.from('user\0', 'utf8'), Buffer.from(user + '\0', 'utf8'),
                              Buffer.from('database\0', 'utf8'), Buffer.from(database + '\0', 'utf8'),
                              Buffer.from([0])
                            ]);
                    const length = 4 + 4 + params.length;
                    const header = Buffer.alloc(8);
                    header.writeInt32BE(length, 0);
                    header.writeInt32BE(196608, 4);
                    return Buffer.concat([header, params]);
            }

      function testPostgresHandshake(host, port, label, user, database) {
              const tls = require('tls');
              return new Promise((resolve) => {
                        const start = Date.now();
                        let stage = 'connecting';
                        const socket = net.createConnection({ host, port });
                        socket.setTimeout(8000);
                        socket.on('connect', () => {
                                    stage = 'ssl-request';
                                    const sslReq = Buffer.alloc(8);
                                    sslReq.writeInt32BE(8, 0);
                                    sslReq.writeInt32BE(80877103, 4);
                                    socket.write(sslReq);
                        });
                        socket.once('data', (data) => {
                                    const resp = data.toString('latin1');
                                    console.log('[NETCHECK-PG] ' + label + ' SSL response: ' + JSON.stringify(resp) + ' at ' + (Date.now() - start) + 'ms');
                                    if (resp[0] !== 'S') {
                                                  socket.destroy();
                                                  return resolve();
                                    }
                                    stage = 'tls-handshake';
                                    const tlsSocket = tls.connect({ socket, servername: host, rejectUnauthorized: false }, () => {
                                                  console.log('[NETCHECK-PG] ' + label + ' TLS handshake complete at ' + (Date.now() - start) + 'ms');
                                                  stage = 'startup-message';
                                                  tlsSocket.write(buildStartupMessage(user, database));
                                    });
                                    tlsSocket.setTimeout(8000);
                                    tlsSocket.on('data', (d) => {
                                                  console.log('[NETCHECK-PG] ' + label + ' response after startup: type=' + JSON.stringify(String.fromCharCode(d[0])) + ' len=' + d.length + ' hex=' + d.slice(0, 24).toString('hex') + ' at ' + (Date.now() - start) + 'ms');
                                                  tlsSocket.destroy();
                                                  resolve();
                                    });
                                    tlsSocket.on('timeout', () => {
                                                  console.log('[NETCHECK-PG] ' + label + ' TIMEOUT at stage=' + stage + ' after ' + (Date.now() - start) + 'ms');
                                                  tlsSocket.destroy();
                                                  resolve();
                                    });
                                    tlsSocket.on('error', (err) => {
                                                  console.log('[NETCHECK-PG] ' + label + ' TLS ERROR at stage=' + stage + ': ' + err.message + ' after ' + (Date.now() - start) + 'ms');
                                                  resolve();
                                    });
                        });
                        socket.on('timeout', () => {
                                    console.log('[NETCHECK-PG] ' + label + ' TIMEOUT at stage=' + stage + ' after ' + (Date.now() - start) + 'ms');
                                    socket.destroy();
                                    resolve();
                        });
                        socket.on('error', (err) => {
                                    console.log('[NETCHECK-PG] ' + label + ' ERROR at stage=' + stage + ': ' + err.message);
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
      await testPostgresHandshake('aws-0-eu-west-1.pooler.supabase.com', 6543, 'pg-transaction-pooler', 'postgres.nwdchqvouuoohienaeoh', 'postgres');
      await testPostgresHandshake('aws-0-eu-west-1.pooler.supabase.com', 5432, 'pg-session-pooler', 'postgres.nwdchqvouuoohienaeoh', 'postgres');
      console.log('[NETCHECK] Diagnostics complete.');
      process.exit(0);
}

main();
