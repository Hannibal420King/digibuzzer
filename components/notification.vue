<template>
</template>

<script>
export default {
	name: 'Notification',
	props: {
		notification: String
	},
	watch: {
		notification: function (notification) {
			const element = document.createElement('div')
			const id = 'notification_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
			element.id = id
			element.textContent = notification
			element.classList.add('notification')
			document.querySelector('#app').appendChild(element)
			setTimeout(function () {
				element.parentNode.removeChild(element)
				this.$emit('fermer')
			}.bind(this), 2500)
		}
	},
	mounted () {
		const element = document.createElement('div')
		const id = 'notification_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
		element.id = id
		element.textContent = this.notification
		element.classList.add('notification')
		document.querySelector('#app').appendChild(element)
		setTimeout(function () {
			element.parentNode.removeChild(element)
			this.$emit('fermer')
		}.bind(this), 2500)
	}
}
</script>
