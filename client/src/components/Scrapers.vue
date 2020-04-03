<template>
  <v-card class="mx-auto mt-5" max-width="800">
    <NewScraper v-if="addConfig"></NewScraper>
    <v-card-text>
      <v-row justify="center">
        <v-expansion-panels>
          <Scraper :config="config"></Scraper>
        </v-expansion-panels>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn text color="deep-purple accent-4">Learn More</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
// import { mapGetters } from "vuex";
import Scraper from "./Scraper";
import NewScraper from "./NewScraper";
export default {
  name: "Scrapers",
  components: {
    Scraper,
    NewScraper
  },
  props: ["addConfig"],
  data: () => ({
    config: {
      parentKey: "huggies",
      childKey: "faq-us",
      cron: "0 0 15 * *", // min hour day-of-month month day-of-week
      url: "https://www.huggies.com/en-us/faq/question/",
      rules: {
        iterSelector: "div.article_content_wrapper",
        question: {
          selector: ".seo-art-h2",
          isHtml: false
        },
        answer: {
          selector: "p",
          isHtml: true
        }
      }
    }
  }),
  computed: {
    // ...mapGetters(["someGetter"]),
    // myComputedMethod() {}
  },
  methods: {
    myMethod() {}
  }
};
</script>
<style>
</style>