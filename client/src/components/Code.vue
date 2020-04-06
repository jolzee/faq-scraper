<template>
  <v-row justify="center">
    <v-dialog v-model="dialog" scrollable max-width="800px">
      <template v-slot:activator="{ on }">
        <v-btn color="primary" dark v-on="on">Open Dialog</v-btn>
      </template>
      <v-card>
        <v-card-title>Scraper Results</v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 600px;" class="py-3">
          <highlight-code lang="json">{{ results }}</highlight-code>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import "highlight.js/styles/default.css";

export default {
  name: "Code",
  components: {},
  data: () => ({
    dialog: true,
    results: [
      {
        parentKey: "huggies",
        childKey: "faq-us",
        cron: "0 0 15 * *",
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
      },
      {
        parentKey: "huggies",
        childKey: "faq-us",
        cron: "0 0 15 * *",
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
      },
      {
        parentKey: "huggies",
        childKey: "faq-us",
        cron: "0 0 15 * *",
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
    ]
  }),
  computed: {},
  methods: {
    myMethod() {}
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