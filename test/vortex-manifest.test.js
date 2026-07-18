import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')
const manifest = JSON.parse(await read('vortex.manifest.json'))

const baselineScopes = [
	'identity.basic',
	'play.write',
	'events.write',
	'gamification.read',
	'rewards.read'
]

test('manifest requests only the baseline scopes and emitted GAME_SESSION events', async () => {
	assert.deepEqual(manifest.requiredScopes, baselineScopes)
	assert.deepEqual(manifest.optionalScopes, [])
	assert.ok(manifest.events.every((event) => event.source === 'GAME_SESSION'))
	assert.ok(manifest.events.every((event) => event.valueType === 'COUNTER' && event.aggregation === 'SUM'))

	const adapter = await read('renderer/vortex.js')
	assert.match(adapter, /left: '12px'/, 'Vortex panel must not cover the host launch control')
	assert.doesNotMatch(adapter, /right: '12px'/, 'Vortex panel must stay clear of bottom-right game controls')
	const pages = `${await read('pages/index/+Page.vue')}\n${await read('pages/p/+Page.vue')}`
	const declared = new Set([...adapter.matchAll(/'((?:digibuzzer\.)[^']+)'/g)].map((match) => match[1]))
	const emitted = new Set([...pages.matchAll(/trackObserved\('([^']+)'/g)].map((match) => match[1]))
	const registered = new Set(manifest.events.map((event) => event.key))
	assert.deepEqual([...declared].sort(), [...registered].sort())
	assert.deepEqual([...emitted].sort(), [...registered].sort())
})

test('deployment is an exact isolated web plus Redis stack', () => {
	const deployment = manifest.deployment
	assert.equal(deployment.schemaVersion, '1.0')
	assert.deepEqual(deployment.gateway, { service: 'web', port: 'http' })
	assert.deepEqual(deployment.volumes, [
		{ name: 'avatars', kind: 'PERSISTENT', quotaBytes: '1073741824', ownerUid: 1000, ownerGid: 1000 },
		{ name: 'redis-data', kind: 'PERSISTENT', quotaBytes: '1073741824', ownerUid: 999, ownerGid: 999 }
	])

	const web = deployment.services.find((service) => service.name === 'web')
	const redis = deployment.services.find((service) => service.name === 'redis')
	assert.deepEqual(web.image, { source: 'APP' })
	assert.equal(web.vortexEnvironment, true)
	assert.equal(web.environment.REDIS_URL, 'redis://redis:6379')
	assert.equal(web.environment.SESSION_KEY, undefined)
	assert.deepEqual(web.mounts, [{ volume: 'avatars', target: '/app/avatars', readOnly: false }])
	assert.deepEqual(web.healthCheck, {
		protocol: 'HTTP', port: 'http', path: '/healthz', initialDelaySeconds: 10, intervalSeconds: 5, timeoutSeconds: 3, retries: 18
	})

	assert.equal(redis.image.source, 'OCI')
	assert.match(redis.image.reference, /^docker\.io\/library\/redis@sha256:[a-f0-9]{64}$/)
	assert.equal(Object.hasOwn(redis, 'vortexEnvironment'), false)
	assert.equal(redis.readOnlyRootfs, false)
	assert.deepEqual(redis.environment, {})
	assert.deepEqual(redis.command, ['redis-server', '--appendonly', 'yes', '--appendfsync', 'everysec'])
	assert.deepEqual(redis.mounts, [{ volume: 'redis-data', target: '/data', readOnly: false }])
	assert.deepEqual(redis.healthCheck, {
		protocol: 'TCP', port: 'redis', initialDelaySeconds: 3, intervalSeconds: 5, timeoutSeconds: 3, retries: 18
	})
	assert.ok(deployment.services.every((service) => service.ports.every((port) => port.exposure === 'INTERNAL')))
})

test('legal notices, corresponding source, font exceptions, and image contents remain explicit', async () => {
	const [license, readme, attribution, server, dockerfile, dockerignore] = await Promise.all([
		read('LICENSE'), read('README.md'), read('vortex/SOURCE_AND_ATTRIBUTION.md'),
		read('server/app.js'), read('Dockerfile'), read('.dockerignore')
	])
	assert.match(license, /GNU AFFERO GENERAL PUBLIC LICENSE/)
	assert.match(readme, /Apache License(?: Version)? 2\.0/)
	assert.match(readme, /SIL Open Font Licen[cs]e 1\.1/i)
	assert.match(attribution, /Hannibal420King\/digibuzzer\/tree\/vortex-v2/)
	assert.match(server, /app\.get\('\/legal\/source'/)
	assert.match(server, /app\.get\('\/legal\/license'/)
	assert.match(server, /serverOrigin: localServerOrigin/)
	assert.match(await read('pages/c/+onBeforeRender.js'), /pageContext\.serverOrigin \|\| pageContext\.hote/)
	assert.match(await read('pages/p/+onBeforeRender.js'), /pageContext\.serverOrigin \|\| pageContext\.hote/)
	assert.match(dockerfile, /COPY --chown=node:node LICENSE README\.md/)
	assert.doesNotMatch(dockerignore, /^(?:README\.md|LICENSE)$/m)
})

test('catalog asset manifest records complete promotional art and real gameplay screenshots', async () => {
	const assets = JSON.parse(await read('vortex/assets/catalog/asset-manifest.json'))
	assert.equal(assets.status, 'complete-verified')
	assert.deepEqual(assets.assets.map((asset) => asset.kind), [
		'ICON',
		'CARD',
		'HERO',
		'SCREENSHOT',
		'SCREENSHOT',
		'SCREENSHOT'
	])
	const promotional = assets.assets.slice(0, 3)
	const screenshots = assets.assets.slice(3)
	assert.ok(promotional.every((asset) => asset.provenance.type === 'GENERATED_ORIGINAL'))
	assert.ok(promotional.every((asset) => asset.provenance.upstreamReference === null))
	assert.ok(promotional.every((asset) => asset.generationPrompt))
	assert.deepEqual(screenshots.map((asset) => asset.filename), [
		'screenshots/01.webp',
		'screenshots/02.webp',
		'screenshots/03.webp'
	])
	assert.ok(screenshots.every((asset) => asset.width === 1920 && asset.height === 1080))
	assert.ok(screenshots.every((asset) => asset.generationPrompt === null))
	assert.ok(screenshots.every((asset) => asset.provenance.type === 'REAL_GAMEPLAY_CAPTURE'))
	assert.ok(assets.assets.every((asset) => asset.altText && /^[a-f0-9]{64}$/.test(asset.sha256)))
	for (const asset of assets.assets) {
		const bytes = await readFile(path.join(root, 'vortex/assets/catalog', asset.filename))
		assert.equal(bytes.byteLength, asset.byteSize)
		assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
	}
})
