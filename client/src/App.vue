<template>
  <v-app>
    <v-app-bar app color="secondary" dark>
      <div class="d-flex align-center">
        <v-img
          alt="FAQ Scrpaer"
          class="shrink mr-2"
          contain
          src="@/assets/faq-scraper.webp"
          transition="scale-transition"
          width="250"
        />
      </div>

      <v-spacer></v-spacer>

      <v-btn color="accent" @click="addConfig = true">
        <span class="mr-2">Add New Scraper</span>
        <v-icon>mdi-plus-thick</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <Scrapers :addConfig="addConfig" />
    </v-content>
  </v-app>
</template>

<script>
import Scrapers from "./components/Scrapers";

export default {
  name: "App",

  components: {
    Scrapers
  },

  data: () => ({
    addConfig: false
    //
  }),
  methods: {}
};
</script>
