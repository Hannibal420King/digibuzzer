import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = process.env.SMOKE_PORT || '33180'
const suffix = `${process.pid}-${Date.now()}`
const image = `digibuzzer:transport-smoke-${suffix}`
const network = `digibuzzer-transport-smoke-${suffix}`
const redis = `digibuzzer-transport-smoke-redis-${suffix}`
const app = `digibuzzer-transport-smoke-app-${suffix}`
const proxy = `digibuzzer-transport-smoke-proxy-${suffix}`
const avatars = `digibuzzer-transport-smoke-avatars-${suffix}`
const configPath = path.join(root, 'test', 'proxy').replaceAll('\\', '/')

const docker = (args, options = {}) => execFileSync(process.platform === 'win32' ? 'docker.exe' : 'docker', args, { encoding: 'utf8', ...options })

const waitUntilHealthy = async () => {
	for (let attempt = 0; attempt < 45; attempt++) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/healthz`)
			if (response.ok) return
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
	throw new Error('Digibuzzer proxy smoke did not become healthy')
}

try {
	docker(['build', '--tag', image, '.'], { cwd: root, stdio: 'inherit' })
	docker(['network', 'create', network])
	docker(['volume', 'create', avatars])
	docker(['run', '--rm', '--volume', `${avatars}:/data`, 'alpine:3.22', 'chown', '1000:1000', '/data'])
	docker(['run', '--detach', '--name', redis, '--network', network, '--network-alias', 'redis', '--cpus', '0.1', '--memory', '128m', '--pids-limit', '64', '--read-only', '--tmpfs', '/data:rw,noexec,nosuid,size=64m', 'redis:7.4.6-bookworm', 'redis-server', '--save', '', '--appendonly', 'no'])
	docker(['run', '--detach', '--name', app, '--network', network, '--network-alias', 'app', '--cpus', '0.5', '--memory', '384m', '--pids-limit', '128', '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m', '--volume', `${avatars}:/app/avatars`, '--env', 'SESSION_KEY=transport-smoke-only', '--env', 'REDIS_URL=redis://redis:6379', '--env', 'PORT=3000', '--env', 'NODE_ENV=production', '--env', 'NODE_CLUSTER=0', '--env', 'REVERSE_PROXY=0', image])
	docker(['run', '--detach', '--name', proxy, '--network', network, '--cpus', '0.1', '--memory', '64m', '--pids-limit', '64', '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m', '--publish', `127.0.0.1:${port}:8080`, '--volume', `${configPath}:/etc/traefik/config:ro`, 'traefik:v3.5', '--configFile=/etc/traefik/config/traefik-static.yml'])
	await waitUntilHealthy()
	execFileSync(process.execPath, [path.join(root, 'test', 'runtime-smoke.mjs'), 'seed', `http://127.0.0.1:${port}`], {
		cwd: root,
		stdio: 'inherit',
	})
	console.log(JSON.stringify({ proxyTransportSmoke: true, initialTransport: 'polling', upgradedTransport: 'websocket', pollingFallback: true }))
} finally {
	for (const container of [proxy, app, redis]) {
		try {
			docker(['rm', '--force', container])
		} catch {}
	}
	try {
		docker(['network', 'rm', network])
	} catch {}
	try {
		docker(['volume', 'rm', avatars])
	} catch {}
	try {
		docker(['image', 'rm', image])
	} catch {}
}
