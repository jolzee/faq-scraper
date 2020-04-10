<template>
  <v-dialog
    v-if="resultsJson && resultsMode === 'table'"
    v-model="dialog"
    scrollable
    max-width="800px"
  >
    <v-card>
      <v-card-title>Scraper Results</v-card-title>
      <v-divider></v-divider>
      <v-card-text style="height: 600px;" class="py-3">
        <v-data-table
          disable-pagination
          hide-default-footer
          :headers="headers"
          :items="resultsJson.results"
          class="elevation-1"
        >
          <template v-slot:item.question="{ item }">
            <div v-html="item.question" class="font-weight-bold"></div>
          </template>
          <template v-slot:item.answer="{ item }">
            <v-card class="ma-2">
              <v-card-text>
                <div v-html="item.answer"></div>
              </v-card-text>
            </v-card>
          </template>
        </v-data-table>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="clearResults">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "TableResults",
  components: {},
  data: function() {
    return {
      dialog: true,
      headers: [
        {
          text: "Question",
          align: "start",
          sortable: true,
          value: "question",
          width: 200,
          filterable: true
        },
        { text: "Answer", align: "start", sortable: false, value: "answer" }
      ]
    };
  },
  computed: {
    ...mapGetters(["resultsJson", "resultsMode"])
  },
  watch: {},
  methods: {
    clearResults() {
      this.$store.commit("CLEAR_RESULTS_JSON");
    }
  },
  mounted() {}
};
</script>
<style>
</style>