<template>
  <v-app>
    <v-app-bar app color="#FFFAF0" dark>
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

      <v-btn color="indigo darken-4" small @click="addConfig">
        <span class="mr-2">New Scraper</span>
        <v-icon>mdi-plus-thick</v-icon>
      </v-btn>
    </v-app-bar>

    <Code></Code>
    <TableResults></TableResults>

    <v-content>
      <Scrapers></Scrapers>
    </v-content>
  </v-app>
</template>

<script>
// import { mapGetters } from "vuex";

import Scrapers from "./components/Scrapers";
import Code from "./components/Code";
import TableResults from "./components/TableResults";

export default {
  name: "App",
  components: {
    Scrapers,
    Code,
    TableResults
  },
  data: () => ({
    //
  }),
  computed: {
    // ...mapGetters(["testResults"])
  },
  methods: {
    addConfig() {
      this.$store.commit("SHOW_NEW_CONFIG_DIALOG");
    }
  }
};
</script>
