import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';

import App from '@/App.vue';
import router from '@/router';
import { clearEntriesApiCache } from '@/services/entries/entriesPageCache';
import { rollbarService } from '@/services/monitoring/rollbarService';

import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'leaflet/dist/leaflet.css';
import '@/theme/variables.css';
import '@/theme/main.scss';

clearEntriesApiCache();

const app = createApp(App);
const pinia = createPinia();

app.use(IonicVue);
app.use(pinia);
app.use(router);

router.isReady().then(() => {
  //error reporting is wired before the first render, so a failure while mounting
  //is reported instead of only reaching the console
  rollbarService.init(app);

  //a deployed build is checked from the browser: ?rollbar_test=1 on any view
  if (rollbarService.isTestReportRequested(window.location.search)) {
    rollbarService.sendTestReport();
  }

  app.mount('#app');
});
