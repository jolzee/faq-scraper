<template>
  <v-dialog v-if="showNewConfigDialog" v-model="dialog" persistent max-width="800px">
    <v-expansion-panels v-model="panel">
      <Scraper
        :isNew="true"
        :config="getConfigBase"
        :hideIcon="true"
        :expand="true"
        v-on:close="closeDialog"
      ></Scraper>
    </v-expansion-panels>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
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

  computed: {
    ...mapGetters(["showNewConfigDialog", "newConfigBase"]),
    getConfigBase() {
      if (this.newConfigBase) {
        return this.newConfigBase;
      } else {
        return this.config;
      }
    }
  },
  methods: {
    closeDialog() {
      this.$store.commit("HIDE_NEW_CONFIG_DIALOG");
    }
  }
};
</script>
<style>
</style>