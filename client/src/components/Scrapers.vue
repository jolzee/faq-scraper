<template>
  <v-card flat class="mx-auto mt-5" max-width="800">
    <NewScraper></NewScraper>
    <v-card-text>
      <v-row justify="center">
        <v-expansion-panels hover v-if="configs.length > 0">
          <Scraper
            :config="config"
            :readOnlyKeys="true"
            v-for="(config) in configs"
            :key="`${config.parentKey}/${config.childKey}`"
          ></Scraper>
        </v-expansion-panels>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import Scraper from "./Scraper";
import NewScraper from "./NewScraper";
export default {
  name: "Scrapers",
  components: {
    Scraper,
    NewScraper
  },
  props: [],
  data: () => ({}),
  computed: {
    ...mapGetters(["configs"])
  },
  methods: {},
  created() {
    this.$store.dispatch("getAllConfigs");
  }
};
</script>
<style>
</style>