import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import { registerPlugins } from '@core/utils/plugins';
import vue3GoogleLogin from 'vue3-google-login'
import '@fortawesome/fontawesome-free/css/all.css'; // Import Font Awesome CSS
import 'vuetify/styles'; // Import Vuetify styles

import { createVuetify } from 'vuetify';
import { aliases, fa } from 'vuetify/iconsets/fa';

const vuetify = createVuetify({
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: {
      fa,
    },
  },
  // ... other configurations
});

// Styles
import '@core/scss/template/index.scss';
import '@layouts/styles/index.scss';
import '@styles/styles.scss';

// Create vue app
const app = createApp(App);

app.use(createPinia());
app.use(vuetify); // Register Vuetify here

// Register plugins
registerPlugins(app);
// google login
app.use(vue3GoogleLogin, {
  clientId: '442522216743-t2jp9sjf8r33j19j37f7p95pf09ap554.apps.googleusercontent.com'
})
// Mount vue app
app.mount('#app');
