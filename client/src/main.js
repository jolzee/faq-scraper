import Vue from "vue";
import Toasted from "vue-toasted";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import store from "./store";
import VueHighlightJS from "vue-highlight.js";
import json from "highlight.js/lib/languages/json";
import javascript from "highlight.js/lib/languages/javascript";

Vue.use(Toasted);
Vue.use(VueHighlightJS, {
  // Register only languages that you want
  languages: {
    json,
    javascript,
  },
});

Vue.config.productionTip = false;

new Vue({
  vuetify,
  store,
  render: (h) => h(App),
}).$mount("#app");
