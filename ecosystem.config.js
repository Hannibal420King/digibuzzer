module.exports = {
	apps: [{
    	name: 'Digibuzzer',
    	script: 'npm -- run server:prod',
		autorestart: true,
		max_restarts: 20,
		restart_delay: 1000
	}]
}
