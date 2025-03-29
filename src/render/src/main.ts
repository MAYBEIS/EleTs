import './assets/main.css'
import './assets/tailwind.css'
import './assets/custom.css'

import { router } from './router'
import { createApp } from 'vue'
import App from './App.vue'

// createApp(App).mount('#app')
// Router
const Vue_app = createApp(App)
Vue_app.use(router)
// Vue_app.config.devtools = true;
Vue_app.mount('#app');

