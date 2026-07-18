import test from 'node:test'
import assert from 'node:assert/strict'
import { vortexPublicConfig } from '../server/vortex-runtime.js'

test('Vortex public config is disabled when managed values are absent', () => {
	assert.deepEqual(vortexPublicConfig({}), { enabled: false })
})

test('Vortex public config exposes only validated public values', () => {
	assert.deepEqual(vortexPublicConfig({
		VORTEX_PUBLIC_URL: 'https://vortex.example/',
		VORTEX_SDK_URL: 'https://vortex.example/sdk/v1/vortex-game-sdk.js',
		SESSION_KEY: 'must-never-leak',
		VORTEX_EVENT_SIGNING_SECRET: 'must-never-leak'
	}), {
		enabled: true,
		vortexOrigin: 'https://vortex.example',
		sdkUrl: 'https://vortex.example/sdk/v1/vortex-game-sdk.js'
	})
})

test('local HTTP origins are accepted for isolated Vortex development', () => {
	for (const host of ['localhost:8180', '127.0.0.1:8180', 'games.localhost:8180']) {
		assert.equal(vortexPublicConfig({
			VORTEX_PUBLIC_URL: `http://${host}/`,
			VORTEX_SDK_URL: `http://${host}/sdk/v1/vortex-game-sdk.js`
		}).enabled, true)
	}
})

test('unsafe or mismatched Vortex URLs fail closed', () => {
	const unsafe = [
		['http://vortex.example/', 'http://vortex.example/sdk/v1/vortex-game-sdk.js'],
		['https://vortex.example/path', 'https://vortex.example/sdk/v1/vortex-game-sdk.js'],
		['https://vortex.example/', 'https://cdn.example/sdk/v1/vortex-game-sdk.js'],
		['https://vortex.example/', 'https://vortex.example/sdk/vortex-game-sdk.js'],
		['https://vortex.example/', 'https://vortex.example/sdk/v1/vortex-game-sdk.js?token=no'],
		['https://user:password@vortex.example/', 'https://user:password@vortex.example/sdk/v1/vortex-game-sdk.js']
	]
	for (const [origin, sdk] of unsafe) {
		assert.deepEqual(vortexPublicConfig({
			VORTEX_PUBLIC_URL: origin,
			VORTEX_SDK_URL: sdk
		}), { enabled: false })
	}
})
