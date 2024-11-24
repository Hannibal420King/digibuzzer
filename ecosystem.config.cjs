module.exports = {
	apps: [{
    	name: 'Digibuzzer',
    	script: 'server/index.js',
		autorestart: true,
		max_restarts: 10,
		exec_interpreter: 'node',
		env: {
			'NODE_ENV': 'development'
		},
		env_production: {
			'NODE_ENV': 'production'
		}
	}]
}
