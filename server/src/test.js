module.exports = {
  getAll: function ($) {
    let finalResults = [];

    const questions = [];
    const answers = [];
    $("div.show-more table tr").each(function (index, elem) {
      $(elem)
        .find("td[width='561']")
        .each(function (qaIndex, elem) {
          if (index % 2 === 0) {
            questions.push($(elem).text());
          } else {
            answers.push($(elem).html());
          }
        });
    });

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      const answer = answers[index];
      finalResults.push({
        question: question,
        answer: answer,
      });
    }

    return finalResults;
  },
};
