<template>
	<div id="notification" aria-live="polite" />
</template>

<script>
export default {
	name: 'Notification',
	props: {
		notification: String
	},
	watch: {
		notification (notification) {
			if (notification !== '') {
				const element = document.createElement('div')
				const id = 'notification_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
				element.id = id
				element.textContent = notification
				element.classList.add('notification')
				document.querySelector('#notification')?.appendChild(element)
				setTimeout(() => {
					element?.remove()
					this.$emit('fermer')
				}, 2500)
			}
		}
	}
}
</script>
