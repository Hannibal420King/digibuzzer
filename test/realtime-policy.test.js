import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { CLOUDFLARE_ANALYTICS_CONNECT_ORIGIN, CLOUDFLARE_ANALYTICS_SCRIPT_ORIGIN, SOCKET_PING_INTERVAL_MS, SOCKET_PING_TIMEOUT_MS, createSocketServerOptions } from '../server/realtime-policy.js'
import { createSocketClientOptions } from '../renderer/realtime-policy.js'

test('browser starts with reliable polling and retains a WebSocket upgrade path', () => {
	assert.deepEqual(createSocketClientOptions(), {
		autoConnect: true,
		closeOnBeforeunload: false,
		transports: ['polling', 'websocket'],
		upgrade: true,
		rememberUpgrade: false,
	})
})

test('server uses the maintained Socket.IO WebSocket engine and bounded heartbeats', () => {
	const options = createSocketServerOptions('https://digibuzzer.example')
	assert.deepEqual(options.transports, ['polling', 'websocket'])
	assert.equal(options.allowUpgrades, true)
	assert.equal(options.upgradeTimeout, 10_000)
	assert.equal(options.pingInterval, 25_000)
	assert.equal(options.pingTimeout, 20_000)
	assert.equal(Object.hasOwn(options, 'wsEngine'), false)
	assert.equal(SOCKET_PING_INTERVAL_MS, 25_000)
	assert.equal(SOCKET_PING_TIMEOUT_MS, 20_000)
})

test('production CSP permits only Cloudflare documented analytics origins', () => {
	assert.equal(CLOUDFLARE_ANALYTICS_SCRIPT_ORIGIN, 'https://static.cloudflareinsights.com')
	assert.equal(CLOUDFLARE_ANALYTICS_CONNECT_ORIGIN, 'https://cloudflareinsights.com')
})

test('unsupported native eiows is not a production dependency or server override', async () => {
	const [packageJson, server] = await Promise.all([readFile(new URL('../package.json', import.meta.url), 'utf8'), readFile(new URL('../server/app.js', import.meta.url), 'utf8')])
	assert.equal(Object.hasOwn(JSON.parse(packageJson).dependencies, 'eiows'), false)
	assert.doesNotMatch(server, /from ['"]eiows['"]|wsEngine\s*:/)
})
