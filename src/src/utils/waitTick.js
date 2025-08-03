import { nextTick } from 'vue'

export default {
	/**
	 * @types Function[]
	 */
	waitTickList: [],
	startingTick: false,

	// Debouncing utilities
	debounceTimers: new Map(),

	/**
	 *
	 * @param cb Function
	 */
	addWaitTick(cb) {
		this.waitTickList.push(cb)
		return this.startWaitTick()
	},

	async execatueWaitTick()
	{
		if (this.startingTick) return

		this.startingTick = true

		while (this.waitTickList.length) {
			const cb = this.waitTickList.shift()
			await nextTick().then(cb)
		}

		this.startingTick = false
	},

	async startWaitTick() {
		if (!this.startingTick)
		{
			return nextTick(() => this.execatueWaitTick().catch(e => {
				this.startingTick = false
				return this.startWaitTick()
			}))
		}
	},

	/**
	 * Debounce function execution
	 * @param {string} key - Unique key for this debounced function
	 * @param {Function} func - Function to debounce
	 * @param {number} delay - Delay in milliseconds
	 * @param {any} context - Context to bind the function to
	 */
	debounce(key, func, delay = 300, context = null) {
		// Clear existing timer for this key
		if (this.debounceTimers.has(key)) {
			clearTimeout(this.debounceTimers.get(key))
		}

		// Set new timer
		const timer = setTimeout(() => {
			this.debounceTimers.delete(key)
			if (context) {
				func.call(context)
			} else {
				func()
			}
		}, delay)

		this.debounceTimers.set(key, timer)
	},

	/**
	 * Cancel a debounced function
	 * @param {string} key - Key of the debounced function to cancel
	 */
	cancelDebounce(key) {
		if (this.debounceTimers.has(key)) {
			clearTimeout(this.debounceTimers.get(key))
			this.debounceTimers.delete(key)
		}
	},

	/**
	 * Check if a debounced function is pending
	 * @param {string} key - Key to check
	 * @returns {boolean}
	 */
	isDebouncing(key) {
		return this.debounceTimers.has(key)
	},

	/**
	 * Throttle function execution
	 * @param {string} key - Unique key for this throttled function
	 * @param {Function} func - Function to throttle
	 * @param {number} delay - Delay in milliseconds
	 * @param {any} context - Context to bind the function to
	 */
	throttle(key, func, delay = 300, context = null) {
		if (this.debounceTimers.has(key)) {
			return // Already throttling
		}

		// Execute immediately
		if (context) {
			func.call(context)
		} else {
			func()
		}

		// Set throttle timer
		const timer = setTimeout(() => {
			this.debounceTimers.delete(key)
		}, delay)

		this.debounceTimers.set(key, timer)
	}
}
