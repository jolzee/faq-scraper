<template>
  <v-row v-if="resultsJson && resultsMode === 'json'" justify="center">
    <v-dialog v-model="dialog" scrollable max-width="800px">
      <v-card>
        <v-card-title>Scraper Results</v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 600px;" class="py-3">
          <highlight-code lang="json">{{ resultsJson }}</highlight-code>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="clearResults">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { mapGetters } from "vuex";

import "highlight.js/styles/default.css";

export default {
  name: "Code",
  components: {},
  data: () => ({
    dialog: true
  }),
  computed: {
    ...mapGetters(["resultsJson", "resultsMode"])
    // myComputedMethod() {}
  },
  methods: {
    clearResults() {
      this.$store.commit("CLEAR_RESULTS_JSON");
    }
  }
};
</script>
<style>
.v-application code {
  background-color: ghostwhite !important;
  color: unset !important;
  display: block !important;
  border-radius: 0px !important;
  font-size: 100% !important;
  font-weight: unset !important;
}
</style>