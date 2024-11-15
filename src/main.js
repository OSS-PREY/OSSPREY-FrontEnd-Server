import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import { registerPlugins } from '@core/utils/plugins';

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

// Mount vue app
app.mount('#app');
