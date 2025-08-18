import { writable } from 'svelte/store';

const alertMessage = writable<string | null>(null);

let timeout: ReturnType<typeof setTimeout> | null = null;

function showAlert(message: string, duration = 3000) {
    if (timeout) 
        clearTimeout(timeout);

    alertMessage.set(message);

    // Set up auto-dismiss
    timeout = setTimeout(() => {
        alertMessage.set(null);
    }, duration);
}

export { alertMessage, showAlert };