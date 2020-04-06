<template>
  <v-dialog v-model="dialog" persistent max-width="800px">
    <v-expansion-panels v-model="panel">
      <Scraper :config="config" :hideIcon="true" :expand="true"></Scraper>
    </v-expansion-panels>
  </v-dialog>
</template>

<script>
import Scraper from "./Scraper";
export default {
  name: "NewScaper",
  components: {
    Scraper
  },
  data: () => ({
    dialog: true,
    panel: 0,
    config: {
      parentKey: "",
      childKey: "",
      cron: "0 0 1 * *", // min hour day-of-month month day-of-week
      url: "",
      rules: {
        iterSelector: "",
        question: {
          selector: "",
          isHtml: false
        },
        answer: {
          selector: "",
          isHtml: true
        }
      }
    }
  }),
  computed: {},
  methods: {
    myMethod() {}
  }
};
</script>
<style>
</style>